import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Kiểm tra biến môi trường
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({
        status: 'error',
        message: 'Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trên Vercel.'
      });
    }

    // 2. Thử query bảng users
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Lỗi khi truy vấn bảng users.',
        details: error.message,
        code: error.code,
        hint: error.message.includes('relation "public.users" does not exist') 
          ? 'Bảng users chưa được tạo. Bạn quên chưa chạy file supabase-schema.sql trên Supabase!' 
          : 'Sai API Key hoặc URL, hoặc tài khoản Supabase bị tạm khóa.'
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Kết nối Supabase thành công và bảng users đã tồn tại!'
    });

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Lỗi server (crash).',
      details: err?.message || String(err)
    });
  }
}
