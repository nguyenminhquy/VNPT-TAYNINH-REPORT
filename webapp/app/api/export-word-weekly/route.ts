import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // ── Xác thực ──────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { blobUrls } = body;

    if (!blobUrls || Object.keys(blobUrls).length === 0) {
      return NextResponse.json({ error: 'Missing blobUrls' }, { status: 400 });
    }

    const REQUIRED_KEYS = ['weekly1', 'weekly2'];
    const missingKeys = REQUIRED_KEYS.filter(k => !blobUrls[k]);
    if (missingKeys.length > 0) {
      return NextResponse.json({
        error: `Chưa đủ file Excel. Còn thiếu: ${missingKeys.join(', ')}`
      }, { status: 422 });
    }

    // ── Proxy sang Render Python Backend (giống CD5) ─────────────────────────
    const backendUrl = (
      req.headers.get('x-cd5-backend-url') ||
      process.env.CD5_BACKEND_URL ||
      process.env.NEXT_PUBLIC_CD5_BACKEND_URL ||
      'https://vnpt-tayninh-report.onrender.com'
    ).replace(/\/+$/, '');

    try {
      console.log(`[export-word-weekly] Proxying to: ${backendUrl}/export-word-weekly`);
      const renderRes = await fetch(`${backendUrl}/export-word-weekly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrls }),
        signal: AbortSignal.timeout(300_000),
      });

      if (!renderRes.ok) {
        let errMsg = `Lỗi từ Python backend (HTTP ${renderRes.status})`;
        try {
          const errJson = await renderRes.json();
          errMsg = errJson.detail || errJson.error || errMsg;
        } catch {}
        return NextResponse.json({ error: errMsg }, { status: renderRes.status });
      }

      const docxBuffer = await renderRes.arrayBuffer();
      const contentDisposition = renderRes.headers.get('content-disposition') ||
        'attachment; filename="Mất_liên_lạc_Tuần.docx"';

      return new NextResponse(docxBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': contentDisposition,
        }
      });

    } catch (fetchError: any) {
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        return NextResponse.json({
          error: '⏳ Render Backend đang khởi động (cold start). Vui lòng thử lại sau 30 giây.'
        }, { status: 504 });
      }
      return NextResponse.json({
        error: `❌ Không thể kết nối đến Python Backend (${backendUrl}): ${fetchError.message}`
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('[export-word-weekly] Error:', error);
    return NextResponse.json({
      error: error.message || 'Lỗi server nội bộ khi xuất báo cáo Word'
    }, { status: 500 });
  }
}
