import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, role, signerName, unit6, author7, eoffice8 } = data;

    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', '01_Mau_Bao_cao.docx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace title
    if (title !== undefined) {
      doc.replaceParagraphByTextMatch(/Về việc\.* \(3\) \.*/, `Về việc ${title.trim() ? title : '........................................................'}`);
    }

    // Replace content
    if (content !== undefined) {
      doc.replaceParagraphByTextMatch(/\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\(4\)\.\.\.\.\.\./, content.trim() ? content : '........................................................................................................................');
    }

    // Replace role
    if (role !== undefined) {
      doc.replaceParagraphByTextMatch(/GIÁM ĐỐC \(5\)/, role.trim() ? role : 'GIÁM ĐỐC');
    }

    // Replace signerName
    if (signerName !== undefined) {
      doc.replaceParagraphByTextMatch(/Họ và tên/, signerName.trim() ? signerName : '..............................');
    }

    // Replace unit and author
    if (unit6 !== undefined || author7 !== undefined) {
      const u6 = unit6?.trim() ? unit6 : '.....';
      const a7 = author7?.trim() ? author7 : '.....';
      doc.replaceParagraphByTextMatch(/- Lưu: VT, \.\.\.\(6\)\. A\. XX\(7\)\./, `- Lưu: VT, ${u6}. A. ${a7}.`);
    }

    // Replace eoffice
    if (eoffice8 !== undefined) {
      const e8 = eoffice8?.trim() ? eoffice8 : '.....';
      doc.replaceParagraphByTextMatch(/Số eOffice: \.\.\(8\)\.\.-VBKS/, `Số eOffice: ${e8}-VBKS`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Mau_Bao_Cao.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating mau bao cao:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
