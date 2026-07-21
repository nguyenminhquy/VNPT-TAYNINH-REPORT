import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Danh sách các path được phép truy cập mà không cần đăng nhập.
 * Sử dụng startsWith để hỗ trợ nested routes.
 */
const PUBLIC_PATHS = ['/login', '/api/auth'];

/**
 * Kiểm tra xem pathname có thuộc vùng công khai không.
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cho qua các public path ngay lập tức
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Cho qua các static assets của Next.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next();
  }

  // ── Kiểm tra JWT token ─────────────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // API routes trả về 401 thay vì redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 },
      );
    }

    // Trang thông thường → redirect về /login, giữ nguyên callbackUrl
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Áp dụng middleware cho tất cả routes ngoại trừ:
   * - _next/static (static files)
   * - _next/image  (image optimization)
   * - favicon.ico
   * - /api/export_python (Standalone Python API)
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/export_python).*)'],
};
