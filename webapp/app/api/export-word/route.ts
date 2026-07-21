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

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { put } from '@vercel/blob';
import { generateWordReport } from '@/lib/word/generateWord';

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

export async function POST(): Promise<NextResponse<ExportWordResponse | ErrorResponse>> {
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

    // ── 2. Lấy cache mới nhất từ report_data_cache ───────────────────────────
    const { data: cacheRows, error: cacheError } = await supabaseAdmin
      .from('report_data_cache')
      .select('id, data, generated_at')
      .order('generated_at', { ascending: false })
      .limit(1);

    if (cacheError) {
      console.error('[export-word/POST] cache query error:', cacheError);
      return NextResponse.json(
        { error: 'Không thể truy vấn dữ liệu cache. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    // Nếu chưa có cache → yêu cầu upload đủ 8 file
    if (!cacheRows || cacheRows.length === 0 || !cacheRows[0].data) {
      return NextResponse.json(
        {
          error:
            'Chưa có dữ liệu. Vui lòng upload đủ 8 file Excel trước khi xuất báo cáo.',
        },
        { status: 403 }
      );
    }

    const cacheEntry = cacheRows[0];
    const cacheData  = cacheEntry.data as Record<string, unknown>;

    // Lấy weekLabel từ cache (nếu có) để ghi vào lịch sử
    const weekLabel =
      typeof cacheData.weekLabel === 'string'
        ? cacheData.weekLabel
        : `Cache ${new Date(cacheEntry.generated_at as string).toLocaleDateString('vi-VN')}`;

    // ── 3. Sinh file Word ─────────────────────────────────────────────────────
    let wordBuffer: Buffer;
    try {
      wordBuffer = await generateWordReport(cacheData);
    } catch (genError) {
      console.error('[export-word/POST] generateWordReport error:', genError);
      return NextResponse.json(
        { error: 'Lỗi khi tạo file Word. Vui lòng kiểm tra lại dữ liệu cache.' },
        { status: 500 }
      );
    }

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
