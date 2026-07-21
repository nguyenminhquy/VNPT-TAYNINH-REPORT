import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processAllReports } from '@/app/api/reports/[key]/upload/route';

/**
 * POST /api/reports/process
 * Kích hoạt thủ công quá trình tổng hợp tất cả báo cáo.
 * Yêu cầu đăng nhập.
 */
export async function POST() {
  try {
    // ── Xác thực phiên ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 },
      );
    }

    // ── Gọi hàm tổng hợp ─────────────────────────────────────────────────────
    const result = await processAllReports();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 422 },
      );
    }

    return NextResponse.json({
      message: result.message,
      generated_at: result.generated_at,
    });
  } catch (error) {
    console.error('[process/POST] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 },
    );
  }
}
