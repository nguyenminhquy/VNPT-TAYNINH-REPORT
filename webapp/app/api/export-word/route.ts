import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
  // ── Xác thực ──────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { blobUrls } = await req.json();
    if (!blobUrls || Object.keys(blobUrls).length === 0) {
      return NextResponse.json({ error: 'Missing blobUrls' }, { status: 400 });
    }

    // ── Tạo thư mục tạm ───────────────────────────────────────────────────
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnpt_report_'));

    try {
      // ── Tải các file Excel xuống thư mục tạm ────────────────────────────
      const REQUIRED_KEYS = ['mbb', 'fbb', 'mytv', 'mll', 'ispeed', '5s', 'xlsc', 'appendix'];
      const missingKeys = REQUIRED_KEYS.filter(k => !blobUrls[k]);
      if (missingKeys.length > 0) {
        return NextResponse.json({
          error: `Chưa đủ file Excel. Còn thiếu: ${missingKeys.join(', ')}`
        }, { status: 422 });
      }

      const xlsxPaths: Record<string, string> = {};
      await Promise.all(
        Object.entries(blobUrls).map(async ([key, url]) => {
          const resp = await fetch(url as string, { cache: 'no-store' });
          if (!resp.ok) {
            throw new Error(`Không thể tải file ${key} từ Vercel Blob (HTTP ${resp.status})`);
          }
          const arrayBuffer = await resp.arrayBuffer();
          const filePath = path.join(tmpDir, `${key}.xlsx`);
          fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
          xlsxPaths[key] = filePath;
        })
      );

      // ── Xác định Python interpreter ────────────────────────────────────
      // Ưu tiên: python3 → python → py
      const pythonCandidates = ['python3', 'python', 'py'];
      let pythonBin = 'python';
      for (const candidate of pythonCandidates) {
        try {
          await execFileAsync(candidate, ['--version']);
          pythonBin = candidate;
          break;
        } catch {}
      }

      // ── Tạo script driver gọi generate_report.py ──────────────────────
      const generateScript = path.join(process.cwd(), 'generate_report.py');
      const outputDocx = path.join(tmpDir, 'output.docx');

      // Build paths JSON cho Python script
      const pathsJson = JSON.stringify(xlsxPaths).replace(/\\/g, '\\\\');
      const driverScript = `
import sys, json
sys.path.insert(0, r'${process.cwd().replace(/\\/g, '\\\\')}')
from generate_report import generate_report
excel_paths = json.loads(r'''${pathsJson}''')
generate_report(excel_paths, r'${outputDocx.replace(/\\/g, '\\\\')}')
`;
      const driverPath = path.join(tmpDir, 'driver.py');
      fs.writeFileSync(driverPath, driverScript, 'utf-8');

      // ── Chạy Python ───────────────────────────────────────────────────
      const { stdout, stderr } = await execFileAsync(pythonBin, [driverPath], {
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
        }
      }).catch((err: any) => {
        throw new Error(`Python error: ${err.stderr || err.stdout || err.message}`);
      });

      if (!fs.existsSync(outputDocx)) {
        throw new Error(`Python không tạo được file output. Stderr: ${stderr}`);
      }

      // ── Đọc file kết quả và trả về ───────────────────────────────────
      const docxBuffer = fs.readFileSync(outputDocx);

      return new NextResponse(docxBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="Bao_cao_VNPT_tuan.docx"`,
        }
      });

    } finally {
      // ── Dọn dẹp thư mục tạm ──────────────────────────────────────────
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }

  } catch (error: any) {
    console.error('[export-word/Python] Error:', error);
    return NextResponse.json({
      error: error.message || 'Lỗi server nội bộ khi xuất báo cáo Word'
    }, { status: 500 });
  }
}
