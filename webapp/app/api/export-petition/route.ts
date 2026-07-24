import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { docNumber, docDate, baseClause, manager, author, users } = data;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Missing users array' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'templates', 'ĐN TTHT-KTHT mở mới user tháng 06_2026.docx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace document number
    if (docNumber) {
      doc.replaceParagraphByTextMatch(/Số: \d+\/ĐN-TTHT-KTHT/, `Số: ${docNumber}`);
      doc.replaceParagraphByTextMatch(/Số: .*/, `Số: ${docNumber}`);
    }

    // Replace date
    if (docDate) {
      doc.replaceParagraphByTextMatch(/Tây Ninh, ngày \d+ tháng \d+ năm \d+/, `Tây Ninh, ${docDate}`);
      doc.replaceTextInEntireDocument(/Tây Ninh, ngày \d+ tháng \d+ năm \d+/, `Tây Ninh, ${docDate}`);
    }

    // Replace base clause
    if (baseClause) {
      doc.replaceParagraphByTextMatch(/Căn cứ tờ trình số.*/, baseClause);
    }

    // Replace manager approval
    if (manager) {
      doc.replaceParagraphByTextMatch(/Nguyễn Hoàng Hưng/, manager);
    }

    // Replace author signature
    if (author) {
      doc.replaceParagraphByTextMatch(/Nguyễn Thành Luân/, author);
    }

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
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="De_nghi_cap_user.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating petition:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
