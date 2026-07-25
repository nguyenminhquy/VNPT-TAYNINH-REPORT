import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Nếu có cấu hình Backend riêng (từ header UI hoặc biến môi trường Vercel), chuyển tiếp upload
    const backendUrl = req.headers.get('x-cd5-backend-url') || req.nextUrl?.searchParams.get('backend_url') || process.env.CD5_BACKEND_URL || process.env.NEXT_PUBLIC_CD5_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/upload`, {
          method: 'POST',
          body: formData as any
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Lỗi chuyển tiếp upload lên FastAPI Backend: ${err.message}` }, { status: 502 });
      }
    }

    if (process.env.VERCEL) {
      return NextResponse.json({
        success: false,
        error: '❌ Lỗi cấu hình Vercel: Bạn đã thêm biến CD5_BACKEND_URL trong Vercel Settings nhưng CHƯA BẤM REDEPLOY! Vui lòng vào Vercel -> tab Deployments -> bấm dấu 3 chấm (...) -> chọn Redeploy để kích hoạt biến môi trường!'
      }, { status: 500 });
    }

    const uploadDir = path.join(process.cwd(), '..', 'exports', 'cd5_uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Xóa file cũ trong thư mục upload trước khi lưu file mới
    try {
      const oldFiles = await fs.readdir(uploadDir);
      for (const f of oldFiles) {
        await fs.unlink(path.join(uploadDir, f)).catch(() => {});
      }
    } catch (e) {}

    const fieldMapping: { [key: string]: string } = {
      vt_tientrinh: '01_tien_trinh_xu_ly_su_co_votuyen.xlsx',
      access_tientrinh: '02_tien_trinh_xu_ly_su_co_access.xlsx',
      mane_tientrinh: '03_tien_trinh_xu_ly_su_co_mane.xlsx',
      xlsc_cd5: '04_xlsc_brcd_chi_tiet_cd5.xlsx',
      votuyen_bc: '05_bao_cao_xlsc_tram_votuyen.xlsx',
      export_map: '06_export.xlsx'
    };

    const savedFiles: string[] = [];

    // 1. Kiểm tra upload theo từng card (field cụ thể)
    for (const [field, targetName] of Object.entries(fieldMapping)) {
      const file = formData.get(field) as File | null;
      if (file && file.name) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, targetName);
        await fs.writeFile(filePath, buffer);
        savedFiles.push(`${file.name} -> ${targetName}`);
      }
    }

    // 2. Fallback cho trường hợp upload chung vào mảng 'files'
    if (savedFiles.length === 0) {
      const files = formData.getAll('files') as File[];
      if (!files || files.length === 0) {
        return NextResponse.json({ success: false, error: 'Không có file nào được chọn hoặc tải lên' }, { status: 400 });
      }
      for (const file of files) {
        if (!file.name) continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, file.name);
        await fs.writeFile(filePath, buffer);
        savedFiles.push(file.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã tải lên thành công ${savedFiles.length} file đầu vào.`,
      files: savedFiles
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: `Lỗi tải file: ${error.message}` }, { status: 500 });
  }
}
