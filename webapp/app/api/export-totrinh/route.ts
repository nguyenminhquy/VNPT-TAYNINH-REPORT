import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { docNumber, docDate, title, to, baseClause, content, proposal, recipients, author, manager } = data;

    const templatePath = path.join(process.cwd(), 'templates', 'ToTrinh_Template.docx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace placeholders
    if (docNumber) doc.replaceTextInEntireDocument('{{SO_TO_TRINH}}', docNumber);
    if (docDate) doc.replaceTextInEntireDocument('{{NGAY_THANG}}', docDate);
    if (title) doc.replaceTextInEntireDocument('{{TIEU_DE}}', title);
    if (to) doc.replaceTextInEntireDocument('{{KINH_GUI}}', to);
    if (baseClause) doc.replaceTextInEntireDocument('{{CAN_CU}}', baseClause);
    if (content) doc.replaceTextInEntireDocument('{{NOI_DUNG}}', content);
    if (proposal) doc.replaceTextInEntireDocument('{{DE_XUAT}}', proposal);
    if (recipients) doc.replaceTextInEntireDocument('{{NOI_NHAN}}', recipients);
    if (author) doc.replaceTextInEntireDocument('{{NGUOI_LAP}}', author);
    if (manager) doc.replaceTextInEntireDocument('{{NGUOI_KY}}', manager);

    // Clean up any remaining placeholders just in case
    doc.replaceTextInEntireDocument('{{SO_TO_TRINH}}', '');
    doc.replaceTextInEntireDocument('{{NGAY_THANG}}', '');
    doc.replaceTextInEntireDocument('{{TIEU_DE}}', '');
    doc.replaceTextInEntireDocument('{{KINH_GUI}}', '');
    doc.replaceTextInEntireDocument('{{CAN_CU}}', '');
    doc.replaceTextInEntireDocument('{{NOI_DUNG}}', '');
    doc.replaceTextInEntireDocument('{{DE_XUAT}}', '');
    doc.replaceTextInEntireDocument('{{NOI_NHAN}}', '');
    doc.replaceTextInEntireDocument('{{NGUOI_LAP}}', '');
    doc.replaceTextInEntireDocument('{{NGUOI_KY}}', '');


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
