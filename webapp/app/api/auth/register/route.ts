import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

// Regex kiểm tra định dạng email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body as {
      email: unknown;
      name: unknown;
      password: unknown;
    };

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 },
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tên không được để trống' },
        { status: 400 },
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 },
      );
    }

    // ── Kiểm tra email đã tồn tại chưa ────────────────────────────────────────
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (lookupError) {
      console.error('[register] lookup error:', lookupError);
      return NextResponse.json(
        { error: 'Lỗi kiểm tra tài khoản' },
        { status: 500 },
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 409 },
      );
    }

    // ── Hash password ──────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Insert user mới vào Supabase ───────────────────────────────────────────
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      email: email.toLowerCase(),
      name: name.trim(),
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('[register] insert error:', insertError);
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'Đăng ký thành công' },
      { status: 201 },
    );
  } catch (error) {
    console.error('[register] unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 },
    );
  }
}
