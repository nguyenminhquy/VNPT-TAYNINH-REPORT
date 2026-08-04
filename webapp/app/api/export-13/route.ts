import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      title, // (3) Trích yếu nội dung
      donViBanHanh, // (4) Tên đơn vị ban hành
      nguoiDuocMoi, // (5) Người được mời
      tenCuocHop, // (6) Tên cuộc họp
      chuTri, // (CHUTRI)
      thoiGian, // (THOIGIAN)
      diaDiem, // (7) Địa điểm
      luuY, // (8) Lưu ý
      role, // (9) Quyền hạn người ký
      signerName, // Tên người ký
      unit10, // (10) Lưu VT
      author11, // (11) Người soạn
      eoffice12 // (12) eOffice
    } = data;

    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', '13_Mau_Giay_moi.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // Replace (3) Trích yếu
    if (title !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, title.trim() ? title : '................ (3) ...............');
    }

    // Replace (4) Tên đơn vị ban hành
    if (donViBanHanh !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*4\s*\).*/, donViBanHanh.trim() ? donViBanHanh + ' trân trọng kính mời:' : '..........(4)........................................................ trân trọng kính mời: ….……');
    }

    // Replace (5) Người được mời
    if (nguoiDuocMoi !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, nguoiDuocMoi.trim() ? nguoiDuocMoi : ' … (5) ............................................................................................…….....');
    }

    // Replace (6) Tên cuộc họp
    if (tenCuocHop !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*6\s*\).*/, tenCuocHop.trim() ? `Tới dự ${tenCuocHop}` : 'Tới dự ...........................................(6) .................	.................................... ');
    }

    // Replace (CHUTRI)
    if (chuTri !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(CHUTRI\).*/, chuTri.trim() ? `Chủ trì: ${chuTri}` : 'Chủ trì: ………………………	………………………….……………….');
    }

    // Replace (THOIGIAN)
    if (thoiGian !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(THOIGIAN\).*/, thoiGian.trim() ? `Thời gian: ${thoiGian}` : 'Thời gian:……	 …………………………………………………….');
    }

    // Replace (7) Địa điểm
    if (diaDiem !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*7\s*\).*/, diaDiem.trim() ? `Địa điểm: ${diaDiem}` : 'Địa điểm:..................................................(7)..............................................');
    }

    // Replace (8) Lưu ý
    if (luuY !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*8\s*\).*/, luuY.trim() ? luuY : '	...................................................(8).................................============'); 
      // Using generic dots if empty, replace ============ later to avoid trailing slash bug
      doc.replaceTextInEntireDocument(/============/, './.');
    }

    // Replace role (9)
    if (role !== undefined) {
      doc.replaceTextInEntireDocument(/.*GIÁM ĐỐC.*\(\s*9\s*\).*/i, role.trim() ? role.replace(/\n/g, '\\n') : 'GIÁM ĐỐC (9)');
    }

    // Replace signerName
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*Họ và tên.*/i, signerName.trim() ? signerName : 'Họ và tên');
    }

    // Replace unit (10) and author (11)
    if (unit10 !== undefined || author11 !== undefined) {
      const u = unit10?.trim() ? unit10 : '......';
      const a = author11?.trim() ? author11 : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\(\s*10\s*\).*\(\s*11\s*\).*/, `- Lưu: VT, ${u}. A. ${a}.`);
    }

    // Replace eOffice (12)
    if (eoffice12 !== undefined) {
      const eo = eoffice12.trim() ? eoffice12 : '.....';
      doc.replaceTextInEntireDocument(/.*eOffice.*\(\s*12\s*\).*/, `Số eOffice: ${eo}-VBKS`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Giay_Moi_13.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating Giay Moi 13:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
