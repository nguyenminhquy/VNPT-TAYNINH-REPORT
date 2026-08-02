import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, role, signerName, unit6, author7, eoffice8 } = data;

    const isPGD = role && role.includes('PHÓ GIÁM ĐỐC');
    const templateFileName = isPGD ? '04_Mau_Thong_bao_PGD.docx' : '04_Mau_Thong_bao.docx';
    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', templateFileName);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace title (3)
    if (title !== undefined) {
      let t = title.trim();
      if (t) {
        if (!/^Về việc\s/i.test(t) && !/^V\/v\s/i.test(t)) {
          t = 'Về việc ' + t;
        }
      } else {
        t = 'Về việc ............................... (3) .............................';
      }
      doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, t);
    }

    // Replace content (4)
    if (content !== undefined) {
      const contentStr = content.trim().replace(/\n/g, '\n');
      if (contentStr) {
        doc.replaceTextInEntireDocument(/\(\s*4\s*\)/, contentStr);
      }
    }

    // Replace role (5) if present
    if (role !== undefined) {
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
        'Content-Disposition': 'attachment; filename="Thong_bao_04.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating Thong bao 04:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
