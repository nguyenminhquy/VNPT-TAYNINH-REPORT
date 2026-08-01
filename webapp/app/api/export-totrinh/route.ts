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

    // Replace title (3)
    if (title !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, title.trim() ? title : '..........................................................');
    }

    // Replace to (Kính trình)
    if (to !== undefined) {
      doc.replaceTextInEntireDocument(/.*Kính trình.*/, `Kính trình: ${to.trim() ? to : '......................................................................'}`);
    }

    // Replace (5) with baseClause + content + proposal
    if (baseClause !== undefined || content !== undefined || proposal !== undefined) {
      const parts = [];
      if (baseClause?.trim()) parts.push(baseClause.trim());
      if (content?.trim()) parts.push(content.trim());
      if (proposal?.trim()) parts.push(proposal.trim());
      
      const combined = parts.length > 0 ? parts.join('\n\n') : '................................................ (5) ...................................................................';
      doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, combined.replace(/\n/g, '\\n'));
    }

    // Replace manager (Họ Và Tên)
    if (manager !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ Và Tên.*/i, manager.trim() ? manager : '..............................');
    }

    // Replace author (XX(8))
    if (author !== undefined) {
      const a = author.trim() ? author : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\(\s*8\s*\).*/, `- Lưu: VT, ..... A. ${a}.`);
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
