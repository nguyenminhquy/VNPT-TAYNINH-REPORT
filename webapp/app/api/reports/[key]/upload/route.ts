import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { REPORT_SOURCES } from '@/lib/reports';
import { buildDashboardData } from '@/lib/excel/aggregator';
import { put, del } from '@vercel/blob';
import * as XLSX from 'xlsx';

// Giới hạn kích thước file: 25 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// ── Hàm xử lý tổng hợp tất cả báo cáo ────────────────────────────────────────
/**
 * Kiểm tra xem tất cả 8 nguồn đã có blob_url chưa,
 * nếu có → fetch từng file → tổng hợp → lưu vào cache.
 */
export async function processAllReports(): Promise<{
  success: boolean;
  message: string;
  generated_at?: string;
}> {
  // Lấy toàn bộ nguồn báo cáo
  const { data: sources, error: sourcesError } = await supabaseAdmin
    .from('report_sources')
    .select('*')
    .order('key');

  if (sourcesError) {
    console.error('[processAllReports] sources error:', sourcesError);
    return { success: false, message: 'Không thể tải danh sách nguồn báo cáo' };
  }

  if (!sources || sources.length === 0) {
    return { success: false, message: 'Chưa có nguồn báo cáo nào' };
  }

  // Kiểm tra xem tất cả 8 nguồn đã có blob_url chưa
  const missingBlob = sources.filter(
    (s: Record<string, unknown>) => !s.blob_url,
  );
  if (missingBlob.length > 0) {
    const missingKeys = missingBlob
      .map((s: Record<string, unknown>) => s.key)
      .join(', ');
    return {
      success: false,
      message: `Chưa đủ dữ liệu. Còn thiếu: ${missingKeys}`,
    };
  }

  // Fetch từng blob về Buffer
  const buffers: Record<string, Buffer> = {};

  for (const source of sources as Array<Record<string, string>>) {
    try {
      const response = await fetch(source.blob_url);
      if (!response.ok) {
        return {
          success: false,
          message: `Không thể tải file của nguồn "${source.key}": HTTP ${response.status}`,
        };
      }
      buffers[source.key] = Buffer.from(await response.arrayBuffer());
    } catch (fetchErr) {
      console.error(`[processAllReports] fetch error for ${source.key}:`, fetchErr);
      return {
        success: false,
        message: `Lỗi khi tải file nguồn "${source.key}"`,
      };
    }
  }

  // Tổng hợp dữ liệu dashboard
  let dashboardData: unknown;
  try {
    dashboardData = await buildDashboardData(buffers);
  } catch (buildErr) {
    console.error('[processAllReports] buildDashboardData error:', buildErr);
    return { success: false, message: 'Lỗi khi tổng hợp dữ liệu báo cáo' };
  }

  // Lưu vào cache
  const generated_at = new Date().toISOString();
  const { error: insertError } = await supabaseAdmin
    .from('report_data_cache')
    .insert({ data: dashboardData, generated_at });

  if (insertError) {
    console.error('[processAllReports] insert cache error:', insertError);
    return { success: false, message: 'Lỗi khi lưu cache dữ liệu' };
  }

  return { success: true, message: 'Tổng hợp báo cáo thành công', generated_at };
}

// ── Upload handler ─────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  try {
    // ── Xác thực phiên ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const params = await context.params;
    const { key } = params;

    // ── Validate key có trong danh sách nguồn không ─────────────────────────
    if (!REPORT_SOURCES.some(s => s.key === key)) {
      return NextResponse.json(
        { error: `Key "${key}" không hợp lệ` },
        { status: 400 },
      );
    }

    // ── Parse FormData ───────────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Không thể đọc form data' },
        { status: 400 },
      );
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Không tìm thấy file upload' },
        { status: 400 },
      );
    }

    // ── Validate định dạng file: chỉ chấp nhận .xlsx ────────────────────────
    const fileName = file.name;
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Chỉ chấp nhận file .xlsx' },
        { status: 400 },
      );
    }

    // ── Validate kích thước file: tối đa 25MB ───────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        { error: `File quá lớn (${sizeMB} MB). Tối đa 25 MB` },
        { status: 400 },
      );
    }

    // ── Đọc nội dung file vào buffer ─────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // ── Validate nội dung Excel: đọc thử bằng XLSX ───────────────────────────
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { error: 'File Excel không hợp lệ hoặc rỗng' },
          { status: 400 },
        );
      }
    } catch (xlsxErr) {
      console.error('[upload] XLSX parse error:', xlsxErr);
      return NextResponse.json(
        { error: 'File không phải định dạng Excel hợp lệ' },
        { status: 400 },
      );
    }

    // ── Lấy thông tin nguồn hiện tại để kiểm tra blob cũ ─────────────────────
    const { data: currentSource, error: sourceError } = await supabaseAdmin
      .from('report_sources')
      .select('blob_url, blob_pathname')
      .eq('key', key)
      .maybeSingle();

    if (sourceError) {
      console.error('[upload] source lookup error:', sourceError);
      return NextResponse.json(
        { error: 'Lỗi truy vấn thông tin nguồn báo cáo' },
        { status: 500 },
      );
    }

    // ── Upload lên Vercel Blob ────────────────────────────────────────────────
    const timestamp = Date.now();
    const safeFileName = `${key}_${timestamp}.xlsx`;
    const pathname = `reports/${key}/${safeFileName}`;

    let blobResult;
    try {
      blobResult = await put(pathname, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (blobErr: any) {
      console.error('[upload] Vercel Blob error:', blobErr);
      return NextResponse.json(
        { error: `Lỗi upload Vercel Blob: ${blobErr.message || 'Chưa cấu hình Storage hoặc sai Token'}` },
        { status: 500 },
      );
    }

    // ── Xóa blob cũ nếu tồn tại ─────────────────────────────────────────────
    if (currentSource?.blob_url) {
      try {
        await del(currentSource.blob_url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (delErr) {
        // Không block flow nếu xóa blob cũ thất bại
        console.warn('[upload] failed to delete old blob:', delErr);
      }
    }

    // ── Cập nhật report_sources ───────────────────────────────────────────────
    const uploadedBy = (session.user as { id?: string })?.id ?? null;
    const uploadedAt = new Date().toISOString();

    const { data: updatedSource, error: updateError } = await supabaseAdmin
      .from('report_sources')
      .update({
        blob_url: blobResult.url,
        blob_pathname: blobResult.pathname,
        file_size: file.size,
        uploaded_by: uploadedBy,
        uploaded_at: uploadedAt,
      })
      .eq('key', key)
      .select()
      .single();

    if (updateError) {
      console.error('[upload] update source error:', updateError);
      // Cố gắng xóa blob vừa upload để tránh rác
      try {
        await del(blobResult.url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch {
        // ignore
      }
      return NextResponse.json(
        { error: 'Lỗi cập nhật thông tin nguồn báo cáo' },
        { status: 500 },
      );
    }

    // ── Ghi lịch sử upload ────────────────────────────────────────────────────
    await supabaseAdmin.from('upload_history').insert({
      report_key: key,
      file_name: fileName,
      file_size: file.size,
      blob_url: blobResult.url,
      uploaded_by: uploadedBy,
      uploader_name: session.user?.name ?? 'unknown',
      uploaded_at: uploadedAt,
    });

    // ── Thử tổng hợp nếu đủ tất cả 8 nguồn ──────────────────────────────────
    let processResult: { success: boolean; message: string; generated_at?: string } | null = null;

    const { data: allSources } = await supabaseAdmin
      .from('report_sources')
      .select('blob_url');

    const totalSources = allSources?.length ?? 0;
    const readySources = allSources?.filter(
      (s: Record<string, unknown>) => !!s.blob_url,
    ).length ?? 0;

    if (totalSources >= 8 && readySources === totalSources) {
      processResult = await processAllReports();
      if (!processResult.success) {
        console.warn('[upload] processAllReports failed:', processResult.message);
      }
    }

    return NextResponse.json(
      {
        message: 'Upload thành công',
        source: updatedSource,
        ...(processResult ? { process: processResult } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[upload] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 },
    );
  }
}
