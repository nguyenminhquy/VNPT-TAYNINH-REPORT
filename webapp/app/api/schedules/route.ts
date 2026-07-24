import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || '0');
    const week = parseInt(searchParams.get('week') || '0');

    if (!year || !week) {
      return NextResponse.json({ error: 'Missing year or week' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('weekly_schedules')
      .select('*')
      .eq('year', year)
      .eq('week_number', week)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ data: data || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admin can publish)
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('email', session.user.email)
      .single();

    if (!userRow) {
      return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
    }

    const body = await req.json();
    const { year, week_number, start_date, end_date, status, schedule_data, general_notes, action } = body;

    // If action is copy, we fetch the previous week's data
    if (action === 'copy') {
      const prevWeek = week_number === 1 ? 52 : week_number - 1;
      const prevYear = week_number === 1 ? year - 1 : year;
      
      const { data: prevData, error: prevErr } = await supabaseAdmin
        .from('weekly_schedules')
        .select('schedule_data')
        .eq('year', prevYear)
        .eq('week_number', prevWeek)
        .maybeSingle();
        
      if (prevErr) throw prevErr;
      if (!prevData) {
        return NextResponse.json({ error: 'Không tìm thấy dữ liệu tuần trước để sao chép' }, { status: 404 });
      }
      
      return NextResponse.json({ data: prevData.schedule_data });
    }

    // Enforce publish permission
    if (status === 'published' && !userRow.is_admin) {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền ban hành lịch!' }, { status: 403 });
    }

    const payload: any = {
      year,
      week_number,
      start_date,
      end_date,
      status: status || 'draft',
      schedule_data: schedule_data || {},
      general_notes: general_notes || '',
      updated_at: new Date().toISOString()
    };

    // Upsert based on year + week_number unique constraint
    const { data, error } = await supabaseAdmin
      .from('weekly_schedules')
      .upsert(payload, { onConflict: 'year,week_number' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
