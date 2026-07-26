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

    const REQUIRED_KEYS = ['mbb', 'fbb', 'mytv', 'mll', 'ispeed', '5s', 'xlsc', 'appendix'];
    const missingKeys = REQUIRED_KEYS.filter(k => !blobUrls[k]);
    if (missingKeys.length > 0) {
      return NextResponse.json({
        error: `Chưa đủ file Excel. Còn thiếu: ${missingKeys.join(', ')}`
      }, { status: 422 });
    }

    // ── Proxy sang Render Python Backend (giống CD5) ─────────────────────────
    // Ưu tiên: header từ UI → biến môi trường Vercel → default Render URL
    const backendUrl = (
      req.headers.get('x-cd5-backend-url') ||
      process.env.CD5_BACKEND_URL ||
      process.env.NEXT_PUBLIC_CD5_BACKEND_URL ||
      'https://vnpt-tayninh-report.onrender.com'
    ).replace(/\/+$/, '');

    try {
      console.log(`[export-word] Proxying to: ${backendUrl}/export-word`);
      const renderRes = await fetch(`${backendUrl}/export-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrls }),
        // Timeout 5 phút (Render free instance có thể cold start ~50s)
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

      // Stream file .docx trực tiếp từ Render về browser
      const docxBuffer = await renderRes.arrayBuffer();
      const contentDisposition = renderRes.headers.get('content-disposition') ||
        'attachment; filename="Bao_cao_VNPT_tuan.docx"';

      return new NextResponse(docxBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': contentDisposition,
        }
      });

    } catch (fetchError: any) {
      // Xử lý riêng lỗi timeout / cold start
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        return NextResponse.json({
          error: '⏳ Render Backend đang khởi động (cold start). Vui lòng thử lại sau 30 giây. Render free tier tắt sau 15 phút không hoạt động.'
        }, { status: 504 });
      }
      return NextResponse.json({
        error: `❌ Không thể kết nối đến Python Backend (${backendUrl}): ${fetchError.message}`
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('[export-word] Error:', error);
    return NextResponse.json({
      error: error.message || 'Lỗi server nội bộ khi xuất báo cáo Word'
    }, { status: 500 });
  }
}
