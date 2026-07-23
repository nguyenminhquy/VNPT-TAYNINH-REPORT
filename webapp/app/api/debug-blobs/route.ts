import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: sources } = await supabaseAdmin.from('report_sources').select('key, blob_url');
  const { data: exports } = await supabaseAdmin.from('export_history').select('id, blob_url').order('created_at', { ascending: false }).limit(5);

  return NextResponse.json({ sources, exports });
}
