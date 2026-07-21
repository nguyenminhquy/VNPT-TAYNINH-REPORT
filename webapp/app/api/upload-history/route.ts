import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // ── Xác thực phiên ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 },
      );
    }

    // ── Lấy 50 lần upload gần nhất ────────────────────────────────────────────
    const { data, error } = await supabaseAdmin
      .from('upload_history')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[upload-history/GET] query error:', error);
      return NextResponse.json(
        { error: 'Không thể tải lịch sử upload' },
        { status: 500 },
      );
    }

    return NextResponse.json({ history: data ?? [] });
  } catch (error) {
    console.error('[upload-history/GET] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 },
    );
  }
}
