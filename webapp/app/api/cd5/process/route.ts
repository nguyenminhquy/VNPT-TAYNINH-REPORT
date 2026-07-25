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

    const scriptPath = path.join(baseDir, 'backend', 'process_cd5.py');
    
    // Gọi python script
    try {
      await execFileAsync('python', [
        scriptPath,
        '--dir', inputDir,
        '--out', outputFile,
        '--json-out', jsonOutputFile
      ], {
        cwd: baseDir,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
    } catch (execError: any) {
      console.error('Python execution error:', execError);
      const stdout = execError.stdout || '';
      const stderr = execError.stderr || '';
      
      // Thử đọc thông báo lỗi từ JSON nếu python in ra
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
