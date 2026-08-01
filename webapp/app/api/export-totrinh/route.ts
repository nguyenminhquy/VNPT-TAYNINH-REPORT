import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { docNumber, docDate, title, to, baseClause, content, proposal, recipients, author, manager, role } = data;

    const isPGD = role && role.includes('PHÓ GIÁM ĐỐC');
    const templateFileName = isPGD ? '02_Mau_To_trinh_PGD.docx' : '02_Mau_To_trinh.docx';
    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', templateFileName);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace role
    if (role !== undefined) {
      doc.replaceTextInEntireDocument(/^GIÁM ĐỐC\s*$/, (role.trim() ? role : 'GIÁM ĐỐC').replace(/\n/g, '\\n'));
    }

    // Replace title
    if (title !== undefined) {
      doc.replaceParagraphByTextMatch(/Về việc ….*/, title.trim() ? title : 'Về việc ..........................................................');
    }

    // Replace base clause and to
    if (to !== undefined || baseClause !== undefined) {
      const newTo = to && to.trim() ? `Kính gửi: ${to}\n\n` : 'Kính gửi: .......................................\n\n';
      const newBaseClause = baseClause && baseClause.trim() ? baseClause : 'Căn cứ ............................................................................................................;';
      doc.replaceParagraphByTextMatch(/Căn cứ tờ trình số 1937.*/, `${newTo}${newBaseClause}`);
    }
    
    // Replace content
    if (content !== undefined) {
      doc.replaceParagraphByTextMatch(/Để tạo điều kiện thuận lợi.*/, content.trim() ? content : '........................................................................................................................');
    }

    // Replace proposal
    if (proposal !== undefined) {
      doc.replaceParagraphByTextMatch(/Tổ Khai thác Hệ thống kính đề nghị.*/, proposal.trim() ? proposal : '........................................................................................................................');
    }

    // Replace manager
    if (manager !== undefined) {
      doc.replaceParagraphByTextMatch(/Nguyễn Hoàng Hưng/, manager.trim() ? manager : '..............................');
    }

    // Replace author
    if (author !== undefined) {
      doc.replaceParagraphByTextMatch(/Nguyễn Thành Luân/, author.trim() ? author : '..............................');
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
