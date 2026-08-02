import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, to, content, role, signerName, unit6, author7, eoffice8 } = data;

    const isPGD = role && role.includes('PHÓ GIÁM ĐỐC');
    const templateFileName = isPGD ? '03b_Mau_Cong_van_gui_1_don_vi_PGD.docx' : '03b_Mau_Cong_van_gui_1_don_vi.docx';
    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', templateFileName);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace title (3)
    if (title !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, title.trim() ? title : '..........................................................');
    }

    // Replace Kính gửi recipient (first purely dotted line)
    if (to !== undefined) {
      const toValue = to.trim() ? to.replace(/\n/g, ' ') : '.......................................';
      doc.replaceTextInEntireDocument(/^[…\.\s]+$/, toValue);
    }

    // Replace content (4)
    if (content !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*4\s*\).*/, content.trim() ? content.replace(/\n/g, '\\n') : '................................................ (4) ...................................................................');
    }

    // Replace role (5) if present
    if (role !== undefined) {
      // It matches GIÁM ĐỐC(5) or GIÁM ĐỐC (5)
      doc.replaceTextInEntireDocument(/.*GIÁM ĐỐC.*\(\s*5\s*\).*/i, (role.trim() ? role : 'GIÁM ĐỐC').replace(/\n/g, '\\n'));
    }

    // Replace signerName
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ và tên.*/i, signerName.trim() ? signerName : '..............................');
    }

    // Replace unit (6) and author (7)
    if (unit6 !== undefined || author7 !== undefined) {
      const u = unit6?.trim() ? unit6 : '......';
      const a = author7?.trim() ? author7 : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\(\s*6\s*\).*\(\s*7\s*\).*/, `- Lưu: VT, ${u}. A. ${a}.`);
    }

    // Replace eOffice (8)
    if (eoffice8 !== undefined) {
      const eo = eoffice8.trim() ? eoffice8 : '.....';
      doc.replaceTextInEntireDocument(/.*eOffice.*\(\s*8\s*\).*/, `Số eOffice: ${eo}-VBKS`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Cong_van_3b.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating cong van 3b:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
