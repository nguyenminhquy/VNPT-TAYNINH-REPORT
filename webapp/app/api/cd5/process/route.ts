import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import util from 'util';

const execFileAsync = util.promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    let useSample = false;
    try {
      const body = await req.json();
      useSample = !!body.use_sample;
    } catch (e) {
      // no body or not json
    }

    const baseDir = path.resolve(process.cwd(), '..');
    const inputDir = useSample
      ? path.join(baseDir, 'templates', 'TTS')
      : path.join(baseDir, 'exports', 'cd5_uploads');
    
    const outputFile = path.join(baseDir, 'exports', 'BaoCao_XLSC_TayNinh_Updated.xlsx');
    const jsonOutputFile = path.join(baseDir, 'exports', 'cd5_result.json');

    // Kiểm tra xem inputDir có tồn tại không
    try {
      const stats = await fs.stat(inputDir);
      if (!stats.isDirectory()) {
        return NextResponse.json({ success: false, error: 'Thư mục chứa dữ liệu đầu vào không đúng định dạng.' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Chưa có dữ liệu nào được upload. Vui lòng chọn file trước hoặc bấm Dùng Dữ liệu Mẫu.' }, { status: 400 });
    }

    // 1. Kiểm tra kiến trúc phân tách Backend (nếu cắm biến môi trường CD5_BACKEND_URL hoặc NEXT_PUBLIC_CD5_BACKEND_URL)
    const backendUrl = process.env.CD5_BACKEND_URL || process.env.NEXT_PUBLIC_CD5_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ use_sample: useSample })
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err: any) {
        return NextResponse.json({ 
          success: false, 
          error: `❌ Lỗi kết nối đến Python FastAPI Backend riêng (${backendUrl}): ${err.message}. Vui lòng kiểm tra lại server Python của bạn!` 
        }, { status: 502 });
      }
    }

    const scriptPath = path.join(baseDir, 'backend', 'process_cd5.py');
    const args = [
      scriptPath,
      '--dir', inputDir,
      '--out', outputFile,
      '--json-out', jsonOutputFile
    ];
    const execOpts = { cwd: baseDir, maxBuffer: 20 * 1024 * 1024 };

    // 2. Thử chạy python (cho môi trường Windows/Linux nội bộ có cài Python)
    try {
      await execFileAsync('python', args, execOpts);
    } catch (execError: any) {
      // Nếu không thấy lệnh python, thử python3
      if (execError.code === 'ENOENT' || (execError.message && execError.message.includes('ENOENT'))) {
        try {
          await execFileAsync('python3', args, execOpts);
        } catch (execErr3: any) {
          if (execErr3.code === 'ENOENT' || (execErr3.message && execErr3.message.includes('ENOENT'))) {
            return NextResponse.json({
              success: false,
              error: `❌ Lỗi kiến trúc Vercel Serverless Function: Không tìm thấy Python runtime (Lỗi: spawn python ENOENT).\n\n👉 NGUYÊN NHÂN: Môi trường Linux Serverless của Vercel chỉ chạy Node.js, không tích hợp sẵn Python, pandas và openpyxl cho Node API theo cách gọi lệnh hệ thống.\n\n👉 3 HƯỚNG GIẢI QUYẾT CHUẨN:\n1. (Khuyến nghị - Đúng kiến trúc bạn nêu): Triển khai thư mục 'backend/' thành Python FastAPI Backend riêng (trên Render, Railway hoặc VPS nội bộ VNPT) và cắm biến môi trường CD5_BACKEND_URL vào Vercel.\n2. Chạy Web App trực tiếp trên máy chủ Windows nội bộ của VNPT Tây Ninh (nơi đã cài sẵn Python 3.13 + pandas + openpyxl).\n3. Sử dụng Docker container đóng gói cả Node.js và Python.`,
              is_enoent: true
            }, { status: 500 });
          }
          throw execErr3;
        }
      } else {
        console.error('Python execution error:', execError);
        const stdout = execError.stdout || '';
        const stderr = execError.stderr || '';
        
        let errorDetail = stderr || execError.message;
        if (stdout.includes('###_CD5_JSON_START_###')) {
          try {
            const parts = stdout.split('###_CD5_JSON_START_###')[1].split('###_CD5_JSON_END_###')[0];
            const errObj = JSON.parse(parts.trim());
            if (errObj.error) errorDetail = errObj.error;
          } catch (parseErr) {}
        }
        return NextResponse.json({ success: false, error: `Lỗi xử lý dữ liệu Excel: ${errorDetail}` }, { status: 500 });
      }
    }

    // Đọc file kết quả JSON
    try {
      const jsonContent = await fs.readFile(jsonOutputFile, 'utf-8');
      const data = JSON.parse(jsonContent);
      return NextResponse.json({
        success: true,
        message: 'Xử lý dữ liệu và tạo Báo cáo Excel 5 Sheet thành công!',
        data: data
      });
    } catch (readErr: any) {
      return NextResponse.json({ success: false, error: `Không thể đọc kết quả đầu ra: ${readErr.message}` }, { status: 500 });
    }
  } catch (err: any) {
    console.error('API process error:', err);
    return NextResponse.json({ success: false, error: `Lỗi hệ thống: ${err.message}` }, { status: 500 });
  }
}
