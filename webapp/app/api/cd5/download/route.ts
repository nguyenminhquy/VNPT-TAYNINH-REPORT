import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const backendUrl = req.headers.get('x-cd5-backend-url') || req.nextUrl?.searchParams.get('backend_url') || process.env.CD5_BACKEND_URL || process.env.NEXT_PUBLIC_CD5_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/download`);
        const buffer = await res.arrayBuffer();
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', 'attachment; filename="BaoCao_XLSC_TayNinh_Updated.xlsx"');
        return new NextResponse(buffer, { status: 200, headers });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Lỗi tải báo cáo từ FastAPI Backend: ${err.message}` }, { status: 502 });
      }
    }

    const outputFile = path.join(process.cwd(), '..', 'exports', 'BaoCao_XLSC_TayNinh_Updated.xlsx');
    
    try {
      const stats = await fs.stat(outputFile);
      if (!stats.isFile()) throw new Error('Not file');
    } catch (e) {
      return NextResponse.json({ success: false, error: 'File Excel báo cáo chưa tồn tại. Vui lòng chạy Xử lý Báo cáo trước.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(outputFile);

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="BaoCao_XLSC_TayNinh_Updated.xlsx"');
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ success: false, error: `Lỗi tải file: ${error.message}` }, { status: 500 });
  }
}
