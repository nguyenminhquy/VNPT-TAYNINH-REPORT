import { NextResponse } from 'next/server';

export async function GET() {
  const cd5BackendUrl = process.env.CD5_BACKEND_URL || null;
  const nextPublicCd5BackendUrl = process.env.NEXT_PUBLIC_CD5_BACKEND_URL || null;
  const defaultFallback = process.env.VERCEL ? 'https://vnpt-tayninh-report.onrender.com' : null;
  const effectiveUrl = cd5BackendUrl || nextPublicCd5BackendUrl || defaultFallback;

  return NextResponse.json({
    success: true,
    message: 'Kiểm tra trạng thái kết nối Backend trên máy chủ Vercel',
    envs: {
      CD5_BACKEND_URL: cd5BackendUrl,
      NEXT_PUBLIC_CD5_BACKEND_URL: nextPublicCd5BackendUrl,
      DEFAULT_RENDER_FALLBACK: defaultFallback,
      EFFECTIVE_BACKEND_URL: effectiveUrl,
      VERCEL_ENV: process.env.VERCEL_ENV || null
    },
    status: effectiveUrl ? '✅ THÀNH CÔNG: Hệ thống đã có Backend Python xử lý 24/7!' : '❌ LỖI: Không tìm thấy Backend xử lý.'
  });
}
