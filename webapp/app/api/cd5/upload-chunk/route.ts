import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Nếu có cấu hình Backend riêng (từ header UI hoặc biến môi trường Vercel), chuyển tiếp chunk
    const backendUrl = req.headers.get('x-cd5-backend-url') || req.nextUrl?.searchParams.get('backend_url') || process.env.CD5_BACKEND_URL || process.env.NEXT_PUBLIC_CD5_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/upload-chunk`, {
          method: 'POST',
          body: formData as any
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Lỗi chuyển tiếp chunk lên FastAPI Backend: ${err.message}` }, { status: 502 });
      }
    }

    if (process.env.VERCEL) {
      return NextResponse.json({
        success: false,
        error: '❌ Lỗi cấu hình Vercel: Bạn đã thêm biến CD5_BACKEND_URL trong Vercel Settings nhưng CHƯA BẤM REDEPLOY! Vui lòng vào Vercel -> tab Deployments -> bấm dấu 3 chấm (...) -> chọn Redeploy để kích hoạt biến môi trường!'
      }, { status: 500 });
    }

    const fileChunk = formData.get('chunk') as Blob | null;
    const fileName = formData.get('fileName') as string | null;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string || '0', 10);
    const totalChunks = parseInt(formData.get('totalChunks') as string || '1', 10);
    const clearAll = formData.get('clearAll') === 'true';
    const isFirstChunk = chunkIndex === 0;

    if (!fileChunk || !fileName) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu chunk hoặc tên file' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), '..', 'exports', 'cd5_uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Nếu là file đầu tiên và chunk đầu tiên trong đợt upload mới, dọn dẹp thư mục upload
    if (clearAll && isFirstChunk) {
      try {
        const oldFiles = await fs.readdir(uploadDir);
        for (const f of oldFiles) {
          await fs.unlink(path.join(uploadDir, f)).catch(() => {});
        }
      } catch (e) {}
    }

    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await fileChunk.arrayBuffer());

    if (isFirstChunk) {
      // Ghi đè tạo file mới ở chunk đầu tiên
      await fs.writeFile(filePath, buffer);
    } else {
      // Nối tiếp dữ liệu vào file đang có
      await fs.appendFile(filePath, buffer);
    }

    return NextResponse.json({
      success: true,
      message: `Đã lưu phần ${chunkIndex + 1}/${totalChunks} của file ${fileName}`,
      isDone: chunkIndex === totalChunks - 1
    });
  } catch (error: any) {
    console.error('Upload chunk error:', error);
    return NextResponse.json({ success: false, error: `Lỗi ghi dữ liệu phân đoạn: ${error.message}` }, { status: 500 });
  }
}
