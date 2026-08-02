import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, bases, article1, role, signerName, unit8, author9 } = data;

    const isPGD = role && role.includes('PHÓ GIÁM ĐỐC');
    const templateFileName = isPGD ? '05_Mau_Quyet_dinh_quy_dinh_truc_tiep_PGD.docx' : '05_Mau_Quyet_dinh_quy_dinh_truc_tiep.docx';
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
        t = 'Về việc ...................... (3) ...............................';
      }
      doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, t);
    }

    // (4) GIÁM ĐỐC(4) - Usually this is the authority at the top left. We might just replace it with GIÁM ĐỐC if it's the Director, or keep it if it's not changing.
    // Let's replace `GIÁM ĐỐC(4)` with `GIÁM ĐỐC` (or maybe the selected role? But top-left is always GIÁM ĐỐC for VNPT Tỉnh).
    // Actually, in Quyết định, the top left is usually:
    // TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM
    // VIỄN THÔNG TÂY NINH
    // And below that is `GIÁM ĐỐC`. We will replace `GIÁM ĐỐC(4)` with `GIÁM ĐỐC`.
    doc.replaceTextInEntireDocument(/.*GIÁM ĐỐC\s*\(\s*4\s*\).*/i, 'GIÁM ĐỐC');

    // Replace bases (5)
    if (bases !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, bases.trim() ? bases.replace(/\n/g, '\\n') : 'Căn cứ ...............................................(5) .......................................................');
    }

    // Replace article1 (6)
    if (article1 !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*6\s*\).*/, article1.trim() ? article1.replace(/\n/g, '\\n') : 'Điều 1. ................................................ (6) ......................................................');
    }

    // Replace role (7) if present
    if (role !== undefined) {
      doc.replaceTextInEntireDocument(/.*GIÁM ĐỐC.*\(\s*7\s*\).*/i, (role.trim() ? role : 'GIÁM ĐỐC').replace(/\n/g, '\\n'));
    }

    // Replace signerName
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ và tên.*/i, signerName.trim() ? signerName : '..............................');
    }

    // Replace unit (8) and author (9)
    if (unit8 !== undefined || author9 !== undefined) {
      const u = unit8?.trim() ? unit8 : '......';
      const a = author9?.trim() ? author9 : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\(\s*8\s*\).*\(\s*9\s*\).*/, `- Lưu: VT, ${u}. A. ${a}.`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Quyet_dinh_05.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating Quyet dinh 05:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
