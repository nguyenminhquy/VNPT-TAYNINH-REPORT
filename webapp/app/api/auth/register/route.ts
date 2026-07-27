import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone } = body;

    if (!name || !phone || !name.trim() || !phone.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    // Kiểm tra số điện thoại hợp lệ (từ 8-11 chữ số)
    if (!/^\d{8,11}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ (phải từ 8 đến 11 chữ số).' },
        { status: 400 }
      );
    }

    const email = `${cleanPhone}@vnpt.vn`;

    // Kiểm tra xem số điện thoại (email) đã tồn tại trong hệ thống chưa
    const { data: existingUser, error: queryError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Lỗi truy vấn Supabase:', queryError);
      return NextResponse.json(
        { error: 'Lỗi kiểm tra cơ sở dữ liệu. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: `Số điện thoại này đã được đăng ký cho tài khoản "${existingUser.name}". Vui lòng chuyển sang tab Đăng nhập.` },
        { status: 409 }
      );
    }

    // Mã hóa mật khẩu (chính là số điện thoại)
    const password_hash = await bcrypt.hash(cleanPhone, 10);

    // Thêm người dùng vào cơ sở dữ liệu
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          name: cleanName,
          password_hash,
        },
      ])
      .select('id, name, email')
      .single();

    if (insertError) {
      console.error('Lỗi tạo người dùng Supabase:', insertError);
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản vào lúc này. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Đăng ký tài khoản thành công', user: newUser },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Lỗi server API register:', err);
    return NextResponse.json(
      { error: 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
