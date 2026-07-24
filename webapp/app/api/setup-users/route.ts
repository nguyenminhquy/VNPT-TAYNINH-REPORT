import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const USERS_LIST = [
  {"name": "Huỳnh Anh Quốc", "phone": "0913564968"},
  {"name": "Khổng Trọng Vinh", "phone": "0941621799"},
  {"name": "Lâm Bảo Tuấn", "phone": "0919923817"},
  {"name": "Lê Công Khanh", "phone": "0834589947"},
  {"name": "Lê Minh Nhựt", "phone": "0888552934"},
  {"name": "Lê Ngọc Hân", "phone": "0917752925"},
  {"name": "Lê Thị Niên", "phone": "0949970570"},
  {"name": "Nguyễn Dương Tuấn Phương", "phone": "0947620197"},
  {"name": "Nguyễn Hữu Thái Bão", "phone": "0822831167"},
  {"name": "Nguyễn Lâm Minh Hải", "phone": "0889888085"},
  {"name": "Nguyễn Minh Ngộ", "phone": "0913818666"},
  {"name": "Nguyễn Minh Quý", "phone": "0846050104"},
  {"name": "Nguyễn Minh Tỏ", "phone": "0919739775"},
  {"name": "Nguyễn Phúc Hưng", "phone": "0948142804"},
  {"name": "Nguyễn Quốc Thắng", "phone": "0813084186"},
  {"name": "Nguyễn Thành Luân", "phone": "0947434534"},
  {"name": "Nguyễn Thành Trung", "phone": "0946567774"},
  {"name": "Nguyễn Thị Thu Hà", "phone": "0944315989"},
  {"name": "Nguyễn Trần Hùng Vĩ", "phone": "0822182009"},
  {"name": "Nguyễn Tú Tú", "phone": "0839925914"},
  {"name": "Nguyễn Tấn Khoa", "phone": "0918469727"},
  {"name": "Phạm Khương Duy", "phone": "0918610505"},
  {"name": "Trương Thanh Tâm", "phone": "0838097868"},
  {"name": "Trần Lê Duy Tân", "phone": "0915986775"},
  {"name": "Trần Ngọc Nhi", "phone": "0941759745"},
  {"name": "Võ Hoàng Huy Khang", "phone": "0835539088"},
  {"name": "Đoàn Quế Lâm", "phone": "0846072077"}
];

export async function GET() {
  try {
    const usersToInsert = [];
    
    for (const u of USERS_LIST) {
      const email = `${u.phone}@vnpt.vn`;
      const password_hash = await bcrypt.hash(u.phone, 10);
      usersToInsert.push({
        email,
        name: u.name,
        password_hash
      });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(usersToInsert, { onConflict: 'email' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully seeded users', count: usersToInsert.length, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
