/**
 * app/api/export-word/route.ts
 * POST handler — Tạo file Word từ cache JSON, upload Vercel Blob, lưu lịch sử
 *
 * Flow:
 *  1. Xác thực session (getServerSession)
 *  2. Query report_data_cache mới nhất
 *  3. Gọi generateWordReport() → Buffer
 *  4. Upload lên Vercel Blob
 *  5. Lưu vào export_history
 *  6. Trả về { blobUrl, filename, fileSize }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { put } from '@vercel/blob';

// ─── Kiểu trả về ─────────────────────────────────────────────────────────────

interface ExportWordResponse {
  blobUrl: string;
  filename: string;
  fileSize: number;
}

interface ErrorResponse {
  error: string;
}

// ─── Helper: tạo tên file an toàn ────────────────────────────────────────────

/**
 * Tạo tên file có timestamp, loại bỏ ký tự đặc biệt không an toàn cho URL.
 * Ví dụ: VNPT-Tây-Ninh-Báo-cáo-tuần-20260721-1020.docx
 */
function buildFilename(): string {
  const now = new Date();
  // Chuyển sang múi giờ Việt Nam (UTC+7)
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const datePart = [
    vnTime.getUTCFullYear(),
    pad(vnTime.getUTCMonth() + 1),
    pad(vnTime.getUTCDate()),
  ].join('');
  const timePart = `${pad(vnTime.getUTCHours())}${pad(vnTime.getUTCMinutes())}`;
  return `VNPT-Tay-Ninh-Bao-cao-tuan-${datePart}-${timePart}.docx`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<ExportWordResponse | ErrorResponse>> {
  try {
    // ── 1. Xác thực phiên đăng nhập ──────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập. Vui lòng đăng nhập để xuất báo cáo.' },
        { status: 401 }
      );
    }

    const exporterName = session.user.name ?? session.user.email ?? 'Không rõ';
    const exportedBy   = (session.user as { id?: string }).id ?? null;

    // ── 2. Lấy dữ liệu file Excel từ report_sources ───────────────────────────
    const { data: sourceRows, error: sourceError } = await supabaseAdmin
      .from('report_sources')
      .select('key, blob_url');

    if (sourceError || !sourceRows) {
      console.error('[export-word/POST] source query error:', sourceError);
      return NextResponse.json(
        { error: 'Không thể truy vấn danh sách file. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    const blobUrls: Record<string, string> = {};
    for (const row of sourceRows) {
      if (row.blob_url) {
        blobUrls[row.key] = row.blob_url;
      }
    }

    // Yêu cầu phải có đủ 8 file
    if (Object.keys(blobUrls).length < 8) {
      return NextResponse.json(
        { error: 'Chưa đủ 8 file Excel. Vui lòng upload đầy đủ trước khi xuất báo cáo.' },
        { status: 403 }
      );
    }

    // ── 3. Gọi Python API để sinh file Word ──────────────────────────────────
    const origin = request.nextUrl.origin;
    const pythonApiUrl = `${origin}/api/export_python`;

    console.log(`[export-word/POST] Calling Python API at ${pythonApiUrl}`);
    const pythonRes = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.PYTHON_API_SECRET || 'vnpt-secret-key',
        blob_urls: blobUrls,
      }),
    });

    if (!pythonRes.ok) {
      const pythonText = await pythonRes.text();
      console.error('[export-word] Python API error:', pythonRes.status, pythonText);
      return NextResponse.json(
        { error: `Lỗi Python API (${pythonRes.status}): ${pythonText}` },
        { status: 500 }
      );
    }

    const wordBuffer = await pythonRes.arrayBuffer();

    const fileSize = wordBuffer.byteLength;
    const filename = buildFilename();

    // ── 4. Upload lên Vercel Blob ─────────────────────────────────────────────
    let blobUrl: string;
    try {
      const blob = await put(
        `exports/${filename}`,
        wordBuffer,
        {
          access: 'public',
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
      );
      blobUrl = blob.url;
    } catch (uploadError) {
      console.error('[export-word/POST] Vercel Blob upload error:', uploadError);
      return NextResponse.json(
        { error: 'Lỗi khi upload file lên storage. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    // ── 5. Lưu vào export_history ─────────────────────────────────────────────
    const weekLabel = `Báo cáo ${new Date().toLocaleDateString('vi-VN')}`;
    const { error: insertError } = await supabaseAdmin
      .from('export_history')
      .insert({
        blob_url:      blobUrl,
        blob_pathname: `exports/${filename}`,
        filename,
        file_size:     fileSize,
        exporter_name: exporterName,
        exported_by:   exportedBy,
        week_label:    weekLabel,
      });

    if (insertError) {
      // Không fail request — file đã upload thành công, chỉ log lỗi lịch sử
      console.error('[export-word/POST] insert export_history error:', insertError);
    }

    // ── 6. Trả kết quả thành công ─────────────────────────────────────────────
    console.info(
      `[export-word/POST] ✓ Exported by ${exporterName} — ${filename} (${(fileSize / 1024).toFixed(1)} KB)`
    );

    return NextResponse.json<ExportWordResponse>(
      { blobUrl, filename, fileSize },
      { status: 200 }
    );
  } catch (unexpectedError) {
    console.error('[export-word/POST] unexpected error:', unexpectedError);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ. Vui lòng liên hệ quản trị viên.' },
      { status: 500 }
    );
  }
}
