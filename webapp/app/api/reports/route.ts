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

    // ── Lấy danh sách nguồn báo cáo ──────────────────────────────────────────
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from('report_sources')
      .select('*')
      .order('key');

    if (sourcesError) {
      console.error('[reports/GET] sources error:', sourcesError);
      return NextResponse.json(
        { error: 'Không thể tải danh sách nguồn báo cáo' },
        { status: 500 },
      );
    }

    // ── Lấy cache mới nhất ────────────────────────────────────────────────────
    const { data: cacheRows, error: cacheError } = await supabaseAdmin
      .from('report_data_cache')
      .select('data, generated_at')
      .order('generated_at', { ascending: false })
      .limit(1);

    if (cacheError) {
      console.error('[reports/GET] cache error:', cacheError);
      // Cache lỗi không nên làm fail toàn bộ request
    }

    const cache =
      cacheRows && cacheRows.length > 0
        ? { data: cacheRows[0].data, generated_at: cacheRows[0].generated_at }
        : null;

    return NextResponse.json({ sources: sources ?? [], cache });
  } catch (error) {
    console.error('[reports/GET] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 },
    );
  }
}
