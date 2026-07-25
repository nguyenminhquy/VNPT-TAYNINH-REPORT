import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có file nào được chọn' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), '..', 'exports', 'cd5_uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Xóa file cũ trong thư mục upload trước khi lưu file mới
    try {
      const oldFiles = await fs.readdir(uploadDir);
      for (const f of oldFiles) {
        await fs.unlink(path.join(uploadDir, f)).catch(() => {});
      }
    } catch (e) {
      // ignore if folder empty
    }

    const savedFiles: string[] = [];
    for (const file of files) {
      if (!file.name) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, file.name);
      await fs.writeFile(filePath, buffer);
      savedFiles.push(file.name);
    }

    return NextResponse.json({
      success: true,
      message: `Đã tải lên thành công ${savedFiles.length} file.`,
      files: savedFiles
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: `Lỗi tải file: ${error.message}` }, { status: 500 });
  }
}
