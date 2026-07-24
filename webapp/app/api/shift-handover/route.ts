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
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;

    let query = supabaseAdmin
      .from('shift_handovers')
      .select('*')
      .order('handover_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (date) {
      query = query.eq('handover_date', date);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in GET /api/shift-handover:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from DB to get ID
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('name', session.user?.name || '')
      .single();

    if (!userRow) {
       return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, shift_type, handover_date, notes, items, status } = body;

    const payload: any = {
      shift_type,
      handover_date,
      user_id: userRow.id,
      user_name: userRow.name,
      notes,
      items,
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      payload.completed_at = new Date().toISOString();
    }

    let result;
    if (id) {
      // Update existing draft
      // Check if it's already completed. If completed, do not allow update
      const { data: existing } = await supabaseAdmin
        .from('shift_handovers')
        .select('status, user_id')
        .eq('id', id)
        .single();
        
      if (existing?.status === 'completed') {
        return NextResponse.json({ error: 'Cannot update a completed handover' }, { status: 403 });
      }
      
      // Also ensure the user is the owner (unless admin)
      if (existing?.user_id !== userRow.id) {
         // Assuming no admin override for now
         return NextResponse.json({ error: 'You can only edit your own drafts' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('shift_handovers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('shift_handovers')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in POST /api/shift-handover:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
