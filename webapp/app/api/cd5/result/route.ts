import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const backendUrl = req.headers.get('x-cd5-backend-url') || req.nextUrl?.searchParams.get('backend_url') || process.env.CD5_BACKEND_URL || process.env.NEXT_PUBLIC_CD5_BACKEND_URL || (process.env.VERCEL ? 'https://vnpt-tayninh-report.onrender.com' : null);
    if (backendUrl) {
      const cleanUrl = backendUrl.replace(/\/+$/, '');
      try {
        const res = await fetch(`${cleanUrl}/result`);
        const json = await res.json();
        const payload = json.success !== undefined ? json : { success: true, data: json };
        return NextResponse.json(payload, { status: res.status });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Lỗi lấy kết quả từ FastAPI Backend: ${err.message}` }, { status: 502 });
      }
    }

    const jsonOutputFile = path.join(process.cwd(), '..', 'exports', 'cd5_result.json');
    try {
      const content = await fs.readFile(jsonOutputFile, 'utf-8');
      const data = JSON.parse(content);
      return NextResponse.json({ success: true, data });
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Chưa có dữ liệu thống kê CĐ5 nào. Vui lòng chọn file và bấm Xử lý Báo cáo.'
      }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
