import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, thoiGian, diaDiem, thanhPhan, toChuc, role, signerName, unit6, author7, eoffice8 } = data;

    const templateName = role?.includes('PHÓ GIÁM ĐỐC') ? '11_Mau_Giay_trieu_tap_PGD.docx' : '11_Mau_Giay_trieu_tap.docx';
    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', templateName);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace title (3)
    if (title !== undefined) {
      let t = title.trim();
      if (t) {
        if (/^Về\s/i.test(t)) {
          t = t.substring(3).trim();
        }
        doc.replaceTextInEntireDocument(/\(\s*3\s*\)/, t);
      }
    }

    // Replace fields
    if (thoiGian !== undefined) {
      doc.replaceTextInEntireDocument(/\(\s*TIME\s*\)/, thoiGian || '...');
    }
    if (diaDiem !== undefined) {
      doc.replaceTextInEntireDocument(/\(\s*LOCATION\s*\)/, diaDiem || '...');
    }
    if (thanhPhan !== undefined) {
      doc.replaceTextInEntireDocument(/\(\s*PARTICIPANTS\s*\)/, thanhPhan || '...');
    }
    if (toChuc !== undefined) {
      doc.replaceTextInEntireDocument(/\(\s*ORGANIZATION\s*\)/, toChuc || '...');
    }

    // Replace role (4) if present
    if (role !== undefined) {
      // Note: role could contain newline for PHÓ GIÁM ĐỐC
      doc.replaceTextInEntireDocument(/.*GIÁM ĐỐC.*\(\s*4\s*\).*/i, role.trim() ? role.replace(/\n/g, '\\n') : 'GIÁM ĐỐC (4)');
    }

    // Replace signerName
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ Và Tên.*/i, signerName.trim() ? signerName : '..............................');
    }

    // Replace unit (5) and author (6)
    if (unit6 !== undefined || author7 !== undefined) {
      const u = unit6?.trim() ? unit6 : '......';
      const a = author7?.trim() ? author7 : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\(\s*5\s*\).*\(\s*6\s*\).*/, `- Lưu: VT, ${u}. A. ${a}.`);
    }

    // Replace eOffice (7)
    if (eoffice8 !== undefined) {
      const eo = eoffice8.trim() ? eoffice8 : '.....';
      doc.replaceTextInEntireDocument(/.*eOffice.*\(\s*7\s*\).*/, `Số eOffice: ${eo}-VBKS`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Giay_trieu_tap_11.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating Giay trieu tap 11:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
