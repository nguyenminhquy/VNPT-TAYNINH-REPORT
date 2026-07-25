import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const backendUrl = process.env.CD5_BACKEND_URL || process.env.NEXT_PUBLIC_CD5_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/result`);
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
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
