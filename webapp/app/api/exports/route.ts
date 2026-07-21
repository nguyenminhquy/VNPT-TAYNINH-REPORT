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

    // ── Lấy 20 lần xuất file gần nhất ────────────────────────────────────────
    const { data, error } = await supabaseAdmin
      .from('export_history')
      .select('*')
      .order('exported_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[exports/GET] query error:', error);
      return NextResponse.json(
        { error: 'Không thể tải lịch sử xuất file' },
        { status: 500 },
      );
    }

    return NextResponse.json({ exports: data ?? [] });
  } catch (error) {
    console.error('[exports/GET] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 },
    );
  }
}
