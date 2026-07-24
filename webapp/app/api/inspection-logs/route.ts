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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const abnormalOnly = searchParams.get('abnormalOnly') === 'true';

    let query = supabaseAdmin
      .from('inspection_logs')
      .select('*')
      .order('inspection_date', { ascending: false })
      .order('inspection_time', { ascending: false });

    if (startDate) {
      query = query.gte('inspection_date', startDate);
    }
    if (endDate) {
      query = query.lte('inspection_date', endDate);
    }
    if (abnormalOnly) {
      query = query.eq('is_abnormal', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
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

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email', session.user.email)
      .single();

    if (!userRow) {
      return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
    }

    const body = await req.json();
    const { id, inspection_date, inspection_time, areas_status, notes, is_abnormal, user_name } = body;

    let targetUserId = userRow.id;
    let targetUserName = userRow.name;

    if (user_name && user_name !== userRow.name) {
      targetUserName = user_name;
      const { data: selectedUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('name', user_name)
        .single();
      if (selectedUser) {
        targetUserId = selectedUser.id;
      }
    }

    const payload: any = {
      inspection_date,
      inspection_time,
      user_id: targetUserId,
      user_name: targetUserName,
      areas_status,
      notes,
      is_abnormal,
      updated_at: new Date().toISOString()
    };

    let result;
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('inspection_logs')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('inspection_logs')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
