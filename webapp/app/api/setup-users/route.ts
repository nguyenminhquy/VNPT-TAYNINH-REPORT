import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const USERS_LIST = [
  {
    "name": "Nguyễn Hoàng Hưng",
    "phone": "0918616616"
  },
  {
    "name": "Phạm Bá Lộc",
    "phone": "0918499996"
  },
  {
    "name": "Nguyễn Phát Tài",
    "phone": "0918911007"
  },
  {
    "name": "Đoàn Tấn Phương",
    "phone": "0949250049"
  },
  {
    "name": "Mai Thiện Phương",
    "phone": "0835880097"
  },
  {
    "name": "Đặng Hoàng Vũ",
    "phone": "0918616787"
  },
  {
    "name": "Trịnh Minh Trí",
    "phone": "0918278345"
  },
  {
    "name": "Huỳnh Minh Triết",
    "phone": "0919113959"
  },
  {
    "name": "Nguyễn Phước Lộc",
    "phone": "0813232338"
  },
  {
    "name": "Trần Văn Bình",
    "phone": "0838800286"
  },
  {
    "name": "Lê Minh Hòa",
    "phone": "0919684007"
  },
  {
    "name": "Đinh Phú Trung",
    "phone": "0918606989"
  },
  {
    "name": "Võ Hoàng Anh Tiến",
    "phone": "0839859849"
  },
  {
    "name": "Bùi Minh Khánh",
    "phone": "0913737644"
  },
  {
    "name": "Nguyễn Khương Minh",
    "phone": "0913443091"
  },
  {
    "name": "Bùi Tấn Bảo",
    "phone": "0918760639"
  },
  {
    "name": "Nguyễn Văn Đờ Rét Mười Lăm",
    "phone": "0916127115"
  },
  {
    "name": "Trương Anh Pha",
    "phone": "0916234929"
  },
  {
    "name": "Đặng Chí Hiếu",
    "phone": "0828585258"
  },
  {
    "name": "Huỳnh Tấn Cường",
    "phone": "0835159879"
  },
  {
    "name": "Nguyễn Thế Sự",
    "phone": "0919990052"
  },
  {
    "name": "Lê Kỷ Dậu",
    "phone": "0917088072"
  },
  {
    "name": "Nguyễn Văn Minh",
    "phone": "0812456561"
  },
  {
    "name": "Phan Văn Thành",
    "phone": "0918623181"
  },
  {
    "name": "Phạm Đình Thái",
    "phone": "0824903077"
  },
  {
    "name": "Nguyễn Văn Cường",
    "phone": "0919256783"
  },
  {
    "name": "Trần Quốc Đạt",
    "phone": "0946432493"
  },
  {
    "name": "Nguyễn Phan Duy An",
    "phone": "0888444008"
  },
  {
    "name": "Nguyễn Hiếu Khương",
    "phone": "0942900404"
  },
  {
    "name": "Nguyễn Hữu Thế",
    "phone": "0912172101"
  },
  {
    "name": "Huỳnh Đức Huy",
    "phone": "0949552355"
  },
  {
    "name": "Huỳnh Quốc Hiếu",
    "phone": "0857850260"
  },
  {
    "name": "Đinh Bộ Lĩnh",
    "phone": "0846528979"
  },
  {
    "name": "Thiệu Thái An",
    "phone": "0911685484"
  },
  {
    "name": "Võ Quang Thìn",
    "phone": "0913632800"
  },
  {
    "name": "Lê Duy Bình",
    "phone": "0826549949"
  },
  {
    "name": "Phan Hồng Quang",
    "phone": "0945761661"
  },
  {
    "name": "Bùi Văn Quí",
    "phone": "0919584123"
  },
  {
    "name": "Trần Thuận Thiên",
    "phone": "0916186172"
  },
  {
    "name": "Nguyễn Hoàng Phi",
    "phone": "0945645759"
  },
  {
    "name": "Bùi Hoàng Tường",
    "phone": "0916659889"
  },
  {
    "name": "Tiêu Văn Y",
    "phone": "0948445577"
  },
  {
    "name": "Trần Xuân Toại",
    "phone": "0914403881"
  },
  {
    "name": "Nguyễn Hoàng Sang",
    "phone": "0852038869"
  },
  {
    "name": "Lê Xuân Trình",
    "phone": "0917773898"
  },
  {
    "name": "Đoàn Nguyễn Tuấn Anh",
    "phone": "0943541776"
  },
  {
    "name": "Đặng Ngọc Sơn",
    "phone": "0949786476"
  },
  {
    "name": "Nguyễn Vĩnh Thiên",
    "phone": "0948901239"
  },
  {
    "name": "Lê Xuân Tình",
    "phone": "0918371799"
  },
  {
    "name": "Trần Văn Tấn",
    "phone": "0913729908"
  },
  {
    "name": "Nguyễn Đình Ngọt",
    "phone": "0835358824"
  },
  {
    "name": "Bùi Phạm Hải Đăng",
    "phone": "0916878010"
  },
  {
    "name": "Nguyễn Thành Phạm Trung",
    "phone": "0941328668"
  },
  {
    "name": "Bùi Thanh Sương",
    "phone": "0817385078"
  },
  {
    "name": "Nguyễn Hữu Tân",
    "phone": "0945663773"
  },
  {
    "name": "Phù Hoàng Thành",
    "phone": "0832428439"
  },
  {
    "name": "Huỳnh Lê Citi",
    "phone": "0942377758"
  },
  {
    "name": "Lê Minh Kha",
    "phone": "0829669739"
  },
  {
    "name": "Huỳnh Phước Yên",
    "phone": "0918611919"
  },
  {
    "name": "Đỗ Tấn Phát",
    "phone": "0917769763"
  },
  {
    "name": "Phạm Huỳnh Tuấn Kiệt",
    "phone": "0941338949"
  },
  {
    "name": "Nguyễn Thành Chí",
    "phone": "0837012768"
  },
  {
    "name": "Võ Quang Duy",
    "phone": "0945833826"
  },
  {
    "name": "Phan Thanh Đạt",
    "phone": "0858227839"
  },
  {
    "name": "Phạm Nguyễn Quang Huy",
    "phone": "0947245878"
  },
  {
    "name": "Trần Thái Bình",
    "phone": "0918430555"
  },
  {
    "name": "Nguyễn Hoàng Tuấn",
    "phone": "0915282271"
  },
  {
    "name": "Nguyễn Phát Thịnh",
    "phone": "0829047079"
  },
  {
    "name": "Nguyễn Hoài Tâm",
    "phone": "0944911212"
  },
  {
    "name": "Hoàng Anh",
    "phone": "0917728470"
  },
  {
    "name": "Phạm Đức Nguyên",
    "phone": "0916014541"
  },
  {
    "name": "Nguyễn Thanh Hải",
    "phone": "0946744500"
  },
  {
    "name": "Nguyễn Ngọc Thơ",
    "phone": "0919619755"
  },
  {
    "name": "Nguyễn Đông Triều",
    "phone": "0914433557"
  },
  {
    "name": "Nguyễn Giê Nha",
    "phone": "0918825152"
  },
  {
    "name": "Huỳnh Quốc Thông",
    "phone": "0913814958"
  },
  {
    "name": "Phan Anh Tuấn",
    "phone": "0918486992"
  },
  {
    "name": "Trần Minh Tuấn",
    "phone": "0913858404"
  },
  {
    "name": "Nguyễn Thành Vương",
    "phone": "0914776772"
  },
  {
    "name": "Trần Hoài Vũ",
    "phone": "0917675757"
  },
  {
    "name": "Nguyễn Văn Long",
    "phone": "0919669378"
  },
  {
    "name": "Nguyễn Văn Tài",
    "phone": "0944725238"
  },
  {
    "name": "Phạm Minh Thật",
    "phone": "0911203792"
  },
  {
    "name": "Trịnh Thượng Lào",
    "phone": "0914310210"
  },
  {
    "name": "Nguyễn Tấn Đạt",
    "phone": "0913602796"
  },
  {
    "name": "Nguyễn Hoàng Đạt",
    "phone": "0833823127"
  },
  {
    "name": "Nguyễn Hữu Khương",
    "phone": "0916755759"
  },
  {
    "name": "Nguyễn Trường Quang",
    "phone": "0888193957"
  },
  {
    "name": "Võ Minh Tuấn An",
    "phone": "0942666870"
  },
  {
    "name": "Huỳnh Hạo Thiên",
    "phone": "0943905906"
  },
  {
    "name": "Võ Thế Minh",
    "phone": "0919542919"
  },
  {
    "name": "Lâm Bình Chi",
    "phone": "0913955468"
  },
  {
    "name": "Lê Quốc Trung Thông",
    "phone": "0949939268"
  },
  {
    "name": "Trần Thái Hòa",
    "phone": "0917052852"
  },
  {
    "name": "Trương Đình Lợi",
    "phone": "0914163199"
  },
  {
    "name": "Ngô Văn Tâm",
    "phone": "0917259777"
  },
  {
    "name": "Ngô Trung Hiếu",
    "phone": "0834241286"
  },
  {
    "name": "Đặng Võ Thừa Phong",
    "phone": "0917893993"
  },
  {
    "name": "Trương Vũ Hải",
    "phone": "0911039328"
  },
  {
    "name": "Lê Thành Tài",
    "phone": "0918955485"
  },
  {
    "name": "Trần Thanh Chương",
    "phone": "0819577699"
  },
  {
    "name": "Phạm Tiến Dũng",
    "phone": "0915907377"
  },
  {
    "name": "Lại Quang Vinh",
    "phone": "0912223973"
  },
  {
    "name": "Nguyễn Hải Đăng",
    "phone": "0945796839"
  },
  {
    "name": "Nguyễn Phước Lộc",
    "phone": "0888802064"
  },
  {
    "name": "Lê Ân Tình",
    "phone": "0941202345"
  },
  {
    "name": "Trần Thanh Giàu",
    "phone": "0853837837"
  },
  {
    "name": "Nguyễn Thanh Hùng",
    "phone": "0945562692"
  },
  {
    "name": "Nguyễn Minh Tùng",
    "phone": "0919786039"
  },
  {
    "name": "Hồ Chí Linh",
    "phone": "0916245738"
  },
  {
    "name": "Nguyễn Công Giang",
    "phone": "0941254259"
  },
  {
    "name": "Hứa Kế Tường",
    "phone": "0911917719"
  },
  {
    "name": "Thái Duy Lâm",
    "phone": "0837821860"
  },
  {
    "name": "Nguyễn Thành Luân",
    "phone": "0947434534"
  },
  {
    "name": "Lâm Bảo Tuấn",
    "phone": "0919923817"
  },
  {
    "name": "Nguyễn Minh Tỏ",
    "phone": "0919739775"
  },
  {
    "name": "Trần Lê Duy Tân",
    "phone": "0915986775"
  },
  {
    "name": "Nguyễn Trần Hùng Vĩ",
    "phone": "0822182009"
  },
  {
    "name": "Nguyễn Thành Trung",
    "phone": "0946567774"
  },
  {
    "name": "Lê Ngọc Hân",
    "phone": "0917752925"
  },
  {
    "name": "Trần Ngọc Nhi",
    "phone": "0941759745"
  },
  {
    "name": "Nguyễn Phúc Hưng",
    "phone": "0948142804"
  },
  {
    "name": "Nguyễn Hữu Thái Bão",
    "phone": "0822831167"
  },
  {
    "name": "Lê Công Khanh",
    "phone": "0834589947"
  },
  {
    "name": "Nguyễn Minh Ngộ",
    "phone": "0913818666"
  },
  {
    "name": "Trương Thanh Tâm",
    "phone": "0838097868"
  },
  {
    "name": "Phạm Khương Duy",
    "phone": "0918610505"
  },
  {
    "name": "Lê Minh Nhựt",
    "phone": "0888552934"
  },
  {
    "name": "Đoàn Quế Lâm",
    "phone": "0846072077"
  },
  {
    "name": "Nguyễn Dương Tuấn Phương",
    "phone": "0947620197"
  },
  {
    "name": "Huỳnh Anh Quốc",
    "phone": "0913564968"
  },
  {
    "name": "Nguyễn Minh Quý",
    "phone": "0846050104"
  },
  {
    "name": "Khổng Trọng Vinh",
    "phone": "0941621799"
  },
  {
    "name": "Nguyễn Tú Tú",
    "phone": "0839925914"
  },
  {
    "name": "Nguyễn Tấn Khoa",
    "phone": "0918469727"
  },
  {
    "name": "Phạm Công Tuấn",
    "phone": "0913977739"
  },
  {
    "name": "Lê Huỳnh Minh Ngọc",
    "phone": "0832940068"
  },
  {
    "name": "Lê Trần Thạch Thảo",
    "phone": "0888288688"
  },
  {
    "name": "Trần Thị Thanh Tuyền",
    "phone": "0818475377"
  },
  {
    "name": "Trần Quang Tạo",
    "phone": "0912899778"
  },
  {
    "name": "Võ Quốc Huy",
    "phone": "0914390007"
  },
  {
    "name": "Huỳnh Thành Công",
    "phone": "0911682482"
  },
  {
    "name": "Dương Nhật Phương",
    "phone": "0913352939"
  },
  {
    "name": "Nguyễn Lâm Minh Hải",
    "phone": "0889888085"
  },
  {
    "name": "Phan Hoài Thắm",
    "phone": "0944013131"
  },
  {
    "name": "Nguyễn Thới Hòa",
    "phone": "0918616499"
  },
  {
    "name": "Võ Công Tăng",
    "phone": "0915699575"
  }
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
