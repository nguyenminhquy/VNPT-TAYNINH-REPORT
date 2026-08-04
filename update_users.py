import json
import re

text = """Nguyễn Hoàng Hưng	0918616616
Phạm Bá Lộc	0918499996
Nguyễn Phát Tài	0918911007
Đoàn Tấn Phương	0949250049
Mai Thiện Phương	0835880097
Đặng Hoàng Vũ	0918616787
Trịnh Minh Trí	0918278345
Huỳnh Minh Triết	0919113959
Nguyễn Phước Lộc	0813232338
Trần Văn Bình	0838800286
Lê Minh Hòa	0919684007
Đinh Phú Trung	0918606989
Võ Hoàng Anh Tiến	0839859849
Bùi Minh Khánh	0913737644
Nguyễn Khương Minh	0913443091
Bùi Tấn Bảo	0918760639
Nguyễn Văn Đờ Rét Mười Lăm	0916127115
Trương Anh Pha	0916234929
Đặng Chí Hiếu	0828585258
Huỳnh Tấn Cường	0835159879
Nguyễn Thế Sự	0919990052
Lê Kỷ Dậu	0917088072
Nguyễn Văn Minh	0812456561
Phan Văn Thành	0918623181
Phạm Đình Thái	0824903077
Nguyễn Văn Cường	0919256783
Trần Quốc Đạt	0946432493
Nguyễn Phan Duy An	0888444008
Nguyễn Hiếu Khương	0942900404
Nguyễn Hữu Thế	0912172101
Huỳnh Đức Huy	0949552355
Huỳnh Quốc Hiếu	0857850260
Đinh Bộ Lĩnh	0846528979
Thiệu Thái An	0911685484
Võ Quang Thìn	0913632800
Lê Duy Bình	0826549949
Phan Hồng Quang	0945761661
Bùi Văn Quí	0919584123
Trần Thuận Thiên	0916186172
Nguyễn Hoàng Phi	0945645759
Bùi Hoàng Tường	0916659889
Tiêu Văn Y	0948445577
Trần Xuân Toại	0914403881
Nguyễn Hoàng Sang	0852038869
Lê Xuân Trình	0917773898
Đoàn Nguyễn Tuấn Anh	0943541776
Đặng Ngọc Sơn	0949786476
Nguyễn Vĩnh Thiên	0948901239
Lê Xuân Tình	0918371799
Trần Văn Tấn	0913729908
Nguyễn Đình Ngọt	0835358824
Bùi Phạm Hải Đăng	0916878010
Nguyễn Thành Phạm Trung	0941328668
Bùi Thanh Sương	0817385078
Nguyễn Hữu Tân	0945663773
Phù Hoàng Thành	0832428439
Huỳnh Lê Citi	0942377758
Lê Minh Kha	0829669739
Huỳnh Phước Yên	0918611919
Đỗ Tấn Phát	0917769763
Phạm Huỳnh Tuấn Kiệt	0941338949
Nguyễn Thành Chí	0837012768
Võ Quang Duy	0945833826
Phan Thanh Đạt	0858227839
Phạm Nguyễn Quang Huy	0947245878
Trần Thái Bình	0918430555
Nguyễn Hoàng Tuấn	0915282271
Nguyễn Phát Thịnh	0829047079
Nguyễn Hoài Tâm	0944911212
Hoàng Anh	0917728470
Phạm Đức Nguyên	0916014541
Nguyễn Thanh Hải	0946744500
Nguyễn Ngọc Thơ	0919619755
Nguyễn Đông Triều	0914433557
Nguyễn Giê Nha	0918825152
Huỳnh Quốc Thông	0913814958
Phan Anh Tuấn	0918486992
Trần Minh Tuấn	0913858404
Nguyễn Thành Vương	0914776772
Trần Hoài Vũ	0917675757
Nguyễn Văn Long	0919669378
Nguyễn Văn Tài	0944725238
Phạm Minh Thật	0911203792
Trịnh Thượng Lào	0914310210
Nguyễn Tấn Đạt	0913602796
Nguyễn Hoàng Đạt	0833823127
Nguyễn Hữu Khương	0916755759
Nguyễn Trường Quang	0888193957
Võ Minh Tuấn An	0942666870
Huỳnh Hạo Thiên	0943905906
Võ Thế Minh	0919542919
Lâm Bình Chi	0913955468
Lê Quốc Trung Thông	0949939268
Trần Thái Hòa	0917052852
Trương Đình Lợi	0914163199
Ngô Văn Tâm	0917259777
Ngô Trung Hiếu	0834241286
Đặng Võ Thừa Phong	0917893993
Trương Vũ Hải	0911039328
Lê Thành Tài	0918955485
Trần Thanh Chương	0819577699
Phạm Tiến Dũng	0915907377
Lại Quang Vinh	0912223973
Nguyễn Hải Đăng	0945796839
Nguyễn Phước Lộc	0888802064
Lê Ân Tình	0941202345
Trần Thanh Giàu	0853837837
Nguyễn Thanh Hùng	0945562692
Nguyễn Minh Tùng	0919786039
Hồ Chí Linh	0916245738
Nguyễn Công Giang	0941254259
Hứa Kế Tường	0911917719
Thái Duy Lâm	0837821860
Nguyễn Thành Luân	0947434534
Lâm Bảo Tuấn	0919923817
Nguyễn Minh Tỏ	0919739775
Trần Lê Duy Tân	0915986775
Nguyễn Trần Hùng Vĩ	0822182009
Nguyễn Thành Trung	0946567774
Lê Ngọc Hân	0917752925
Trần Ngọc Nhi	0941759745
Nguyễn Phúc Hưng	0948142804
Nguyễn Hữu Thái Bão	0822831167
Lê Công Khanh	0834589947
Nguyễn Minh Ngộ	0913818666
Trương Thanh Tâm	0838097868
Phạm Khương Duy	0918610505
Lê Minh Nhựt	0888552934
Đoàn Quế Lâm	0846072077
Nguyễn Dương Tuấn Phương	0947620197
Huỳnh Anh Quốc	0913564968
Nguyễn Minh Quý	0846050104
Khổng Trọng Vinh	0941621799
Nguyễn Tú Tú	0839925914
Nguyễn Tấn Khoa	0918469727
Phạm Công Tuấn	0913977739
Lê Huỳnh Minh Ngọc	0832940068
Lê Trần Thạch Thảo	0888288688
Trần Thị Thanh Tuyền	0818475377
Trần Quang Tạo	0912899778
Võ Quốc Huy	0914390007
Huỳnh Thành Công	0911682482
Dương Nhật Phương	0913352939
Nguyễn Lâm Minh Hải	0889888085
Phan Hoài Thắm	0944013131
Nguyễn Thới Hòa	0918616499
Võ Công Tăng	0915699575"""

users = []
for line in text.split('\n'):
    parts = line.strip().split('\t')
    if len(parts) >= 2:
        users.append({'name': parts[0].strip(), 'phone': parts[1].strip()})
    elif ' ' in line:
        parts = line.strip().rsplit(' ', 1)
        if len(parts) == 2 and parts[1].isdigit():
            users.append({'name': parts[0].strip(), 'phone': parts[1].strip()})

users_json = json.dumps(users, ensure_ascii=False, indent=2)

with open('webapp/app/api/setup-users/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r'const USERS_LIST = \[.*?\];', f'const USERS_LIST = {users_json};', code, flags=re.DOTALL)

with open('webapp/app/api/setup-users/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print(f"Updated USERS_LIST with {len(users)} users.")
