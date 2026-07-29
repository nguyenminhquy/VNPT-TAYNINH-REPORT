import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { docNumber, docDate, title, to, baseClause, content, proposal, recipients, author, manager } = data;

    const templatePath = path.join(process.cwd(), 'templates', 'To_trinh.docx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace document number
    if (docNumber) {
      doc.replaceParagraphByTextMatch(/Số: .*\/.*/, `Số: ${docNumber}`);
    }

    // Replace date
    if (docDate) {
      doc.replaceParagraphByTextMatch(/Tây Ninh, ngày.*/, `Tây Ninh, ngày ${docDate}`);
      doc.replaceTextInEntireDocument(/Tây Ninh, ngày.*/, `Tây Ninh, ngày ${docDate}`);
    }

    // Replace title
    if (title) {
      doc.replaceParagraphByTextMatch(/Về việc ….*/, `Về việc ${title}`);
    }

    // Replace base clause and to
    if (to || baseClause) {
      const newTo = to ? `Kính gửi: ${to}\n\n` : '';
      const newBaseClause = baseClause ? baseClause : 'Căn cứ tờ trình số 1937/TTr-TTHT  ngày 17/06/2026 của Trung tâm Hạ tầng V/v xét duyệt tăng nhân viên cho Tổ Khai thác hệ thống đã được Giám đốc Viễn thông Tây Ninh phê duyệt;';
      doc.replaceParagraphByTextMatch(/Căn cứ tờ trình số 1937.*/, `${newTo}${newBaseClause}`);
    }
    
    // Replace content
    if (content) {
      doc.replaceParagraphByTextMatch(/Để tạo điều kiện thuận lợi.*/, content);
    }

    // Replace proposal
    if (proposal) {
      doc.replaceParagraphByTextMatch(/Tổ Khai thác Hệ thống kính đề nghị.*/, proposal);
    }

    // Replace manager
    if (manager) {
      doc.replaceParagraphByTextMatch(/Nguyễn Hoàng Hưng/, manager);
    }

    // Replace author
    if (author) {
      doc.replaceParagraphByTextMatch(/Nguyễn Thành Luân/, author);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="To_trinh.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating to trinh:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
