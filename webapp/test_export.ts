import * as fs from 'fs';
import * as path from 'path';
import { DocxModifier } from './lib/docx-modifier.ts';

const users = [
  {
    name: 'Nguyễn Văn A',
    hrm: 'VNPT123',
    cccd: '123456789',
    phone: '0912345678',
    dob: '01/01/1990',
    email: 'nguyenvana@vnpt.vn',
    title: 'Nhân viên',
    systems: 'CCBS'
  }
];

try {
  const templatePath = path.join(__dirname, 'templates', 'ĐN TTHT-KTHT mở mới user tháng 06_2026.docx');
  const docBuffer = fs.readFileSync(templatePath);
  const doc = new DocxModifier(docBuffer);

  const docNumber = '123/ĐN';
  doc.replaceParagraphByTextMatch(/Số: \d+\/ĐN-TTHT-KTHT/, `Số: ${docNumber}`);
  doc.replaceParagraphByTextMatch(/Số: .*/, `Số: ${docNumber}`);

  const docDate = 'ngày 01 tháng 01 năm 2026';
  doc.replaceParagraphByTextMatch(/Tây Ninh, ngày \d+ tháng \d+ năm \d+/, `Tây Ninh, ${docDate}`);

  // Fill table
  const table = doc.findTableByInternalText('Họ và tên');
  if (table) {
    const matrix = users.map((u: any, i: number) => {
      return [
        String(i + 1),
        `${u.name}\nMã HRM: ${u.hrm}\nCCCD: ${u.cccd}\nSố ĐT: ${u.phone}\nNgày sinh: ${u.dob}\nMail: ${u.email}`,
        u.title,
        `- Tạo mới user: ${u.systems}`
      ];
    });

    doc.resizeTableRows(table, matrix.length);
    doc.writeTableMatrix(table, matrix);
  } else {
    console.log("Table not found!");
  }

  const outputBuffer = doc.getBuffer();
  fs.writeFileSync('test_output.docx', outputBuffer);
  console.log('Success, wrote test_output.docx');
} catch (e) {
  console.error(e);
}
