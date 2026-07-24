import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shiftTypeStr = searchParams.get('shift_type');
    
    let query = supabaseAdmin
      .from('shift_checklist_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (shiftTypeStr) {
      // Lấy các việc chung (0) và việc riêng của ca (shiftTypeStr)
      query = query.in('shift_type', [0, parseInt(shiftTypeStr)]);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return NextResponse.json({ items: data });
  } catch (error: any) {
    console.error('Error in GET /api/shift-checklist:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ở môi trường thực tế, nên kiểm tra session.user.is_admin

    const body = await req.json();
    const { action, item } = body;

    if (action === 'create' || action === 'update') {
      const { data, error } = await supabaseAdmin
        .from('shift_checklist_items')
        .upsert({
          id: item.id, // Sẽ update nếu có id, ngược lại insert
          content: item.content,
          shift_type: item.shift_type,
          is_active: item.is_active !== undefined ? item.is_active : true,
          display_order: item.display_order || 0
        })
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else if (action === 'delete') {
      // Soft delete hoặc hard delete
      const { error } = await supabaseAdmin
        .from('shift_checklist_items')
        .update({ is_active: false })
        .eq('id', item.id);
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/shift-checklist:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
