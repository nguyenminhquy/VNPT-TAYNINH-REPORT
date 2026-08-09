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

    // Get bases array
    let basesArray: string[] = [];
    if (bases !== undefined) {
      if (Array.isArray(bases)) {
        basesArray = bases.filter(b => b.trim());
      } else if (typeof bases === 'string' && bases.trim()) {
        basesArray = bases.split(/\r?\n|\\n/).filter(b => b.trim());
      }
    }

    // Get articles array
    let articlesArray: string[] = [];
    if (article1 !== undefined) {
      if (Array.isArray(article1)) {
        articlesArray = article1.filter(a => a.trim());
      } else if (typeof article1 === 'string' && article1.trim()) {
        articlesArray = article1.split(/\r?\n|\\n/).filter(a => a.trim());
      }
    }

    // Fill Bases exactly into template placeholders
    // First placeholder: (5)
    if (basesArray.length > 0) {
      doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, `Căn cứ ${basesArray[0].replace(/^- Căn cứ |- Căn cứ|Căn cứ /i, '').replace(/;$/, '')};`);
    } else {
      doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, 'Căn cứ ...............................................(5) .......................................................');
    }
    
    // Second placeholder: Căn cứ...............;
    if (basesArray.length > 1) {
      doc.replaceTextInEntireDocument(/^Căn cứ\.+;?$/, `Căn cứ ${basesArray[1].replace(/^- Căn cứ |- Căn cứ|Căn cứ /i, '').replace(/;$/, '')};`);
    }

    // Fill Articles exactly into template placeholders
    // First placeholder: Điều 1 (6)
    if (articlesArray.length > 0) {
      doc.replaceTextInEntireDocument(/.*\(\s*6\s*\).*/, `Điều 1. ${articlesArray[0].replace(/^Điều 1\. /i, '')}`);
    } else {
      doc.replaceTextInEntireDocument(/.*\(\s*6\s*\).*/, 'Điều 1. ................................................ (6) ......................................................');
    }

    // Second placeholder: Điều 2
    if (articlesArray.length > 1) {
      doc.replaceTextInEntireDocument(/^Điều 2\.\s*\.+$/, `Điều 2. ${articlesArray[1].replace(/^Điều 2\. /i, '')}`);
    }

    // Third placeholder: Điều ...
    if (articlesArray.length > 2) {
      doc.replaceTextInEntireDocument(/^Điều \.\.\.\s*\.+$/, `Điều 3. ${articlesArray[2].replace(/^Điều 3\. /i, '')}`);
    }


    // Replace role (7) if present
    if (role !== undefined) {
      doc.replaceTextInEntireDocument(/.*GIÁM ĐỐC.*\(\s*7\s*\).*/i, (role.trim() ? role : 'GIÁM ĐỐC').replace(/\n/g, '\\n'));
    }

    // Replace signerName
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ và tên.*/i, signerName.trim() ? signerName : '..............................');
      doc.replaceTextInEntireDocument(/\(\s*SIGNER\s*\)/i, signerName.trim() ? signerName : 'Họ và tên');
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
