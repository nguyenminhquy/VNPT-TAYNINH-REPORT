import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { nguoiUyQuyen, nguoiDuocUyQuyen, noiDungUyQuyen, role, signerName, unit8, author9 } = data;

    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', '09_Mau_Giay_uy_quyen.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // (3) Người ủy quyền
    if (nguoiUyQuyen !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, nguoiUyQuyen.trim() ? nguoiUyQuyen : '................................... (3) .................................. ');
    }

    // (4) Người được ủy quyền
    if (nguoiDuocUyQuyen !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*4\s*\).*/, nguoiDuocUyQuyen.trim() ? `Ông (bà): ${nguoiDuocUyQuyen}` : 'Ông (bà): ................................................(4)....................................................');
    }

    // (5) Nội dung ủy quyền
    if (noiDungUyQuyen !== undefined) {
      // Get noiDungUyQuyen array to handle newlines
      let noiDungArray: string[] = [];
      if (Array.isArray(noiDungUyQuyen)) {
        noiDungArray = noiDungUyQuyen.filter((a: string) => a.trim());
      } else if (typeof noiDungUyQuyen === 'string' && noiDungUyQuyen.trim()) {
        noiDungArray = noiDungUyQuyen.split(/\r?\n|\\n/).filter((a: string) => a.trim());
      }

      if (noiDungArray.length > 0) {
        doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, noiDungArray[0]);
      } else {
        doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, '..........................................................(5)..................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................../.');
      }
    }

    // (6) Chức vụ người ủy quyền (role)
    if (role !== undefined) {
      doc.replaceTextInEntireDocument(/.*NGƯỜI ỦY QUYỀN.*\(\s*6\s*\).*/i, role.trim() ? role : 'NGƯỜI ỦY QUYỀN (6)');
    }

    // Signer name
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ Và Tên.*/i, signerName.trim() ? signerName : '..............................');
    }

    // Replace unit (7) and author (8)
    if (unit8 !== undefined || author9 !== undefined) {
      const u = unit8?.trim() ? unit8 : '......';
      const a = author9?.trim() ? author9 : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\(\s*7\s*\).*\(\s*8\s*\).*/, `- Lưu: VT, ${u}. A. ${a}.`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Giay_Uy_Quyen_09.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating Giay Uy Quyen 09:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
