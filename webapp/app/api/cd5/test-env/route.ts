import { NextResponse } from 'next/server';

export async function GET() {
  const cd5BackendUrl = process.env.CD5_BACKEND_URL || null;
  const nextPublicCd5BackendUrl = process.env.NEXT_PUBLIC_CD5_BACKEND_URL || null;
  const vercelEnv = process.env.VERCEL_ENV || null;
  const vercelUrl = process.env.VERCEL_URL || null;

  return NextResponse.json({
    success: true,
    message: 'Kiểm tra trạng thái biến môi trường trên máy chủ Vercel',
    envs: {
      CD5_BACKEND_URL: cd5BackendUrl,
      NEXT_PUBLIC_CD5_BACKEND_URL: nextPublicCd5BackendUrl,
      VERCEL_ENV: vercelEnv,
      VERCEL_URL: vercelUrl
    },
    hint: !cd5BackendUrl && !nextPublicCd5BackendUrl
      ? '❌ Vercel không nhìn thấy biến CD5_BACKEND_URL! Hãy kiểm tra lại: 1) Bạn đang mở đúng trang Production hay Preview? 2) Khi thêm biến trong Vercel Settings, bạn đã bấm Redeploy bản mới nhất chưa?'
      : '✅ Vercel đã nhận được biến môi trường kết nối Render!'
  });
}
