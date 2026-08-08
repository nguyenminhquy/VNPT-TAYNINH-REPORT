import os
import shutil
import json
import tempfile
import urllib.request
from pathlib import Path
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from process_cd5 import process_cd5
from generate_demo_report import generate_demo_report_from_json, DemoExportRequest

app = FastAPI(
    title="VNPT Tây Ninh - Báo Cáo Chuyên Đề 5 API",
    description="Backend API tự động hóa tổng hợp, tính toán KPI và xuất Báo cáo Chuyên Đề 5",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "exports" / "cd5_uploads"
OUTPUT_FILE = BASE_DIR / "exports" / "BaoCao_XLSC_TayNinh_Updated.xlsx"
RESULT_JSON_FILE = BASE_DIR / "exports" / "cd5_result.json"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

@app.get("/", summary="Kiểm tra trạng thái hoạt động của Server (Health Check)")
async def root():
    return {
        "status": "online",
        "message": "✨ VNPT Tây Ninh - Báo Cáo Chuyên Đề 5 API Server is Live & Ready!",
        "version": "1.0.0"
    }

@app.post("/upload", summary="Upload 06 file Excel đầu vào")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Nhận danh sách các file Excel đầu vào (Tiến trình Vô tuyến, ACCESS, MANE, XLSC Chi tiết CĐ5, XLSC Vô tuyến, export.xlsx).
    Lưu trữ vào folder uploads để chờ xử lý.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên.")

    saved_files = []
    for file in files:
        if not file.filename.endswith(('.xls', '.xlsx')):
            continue
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(file.filename)

    return {
        "success": True,
        "message": f"Đã tải lên thành công {len(saved_files)} file.",
        "files": saved_files
    }

@app.post("/upload-chunk", summary="Upload phân đoạn (Chunked Upload) cho file Excel lớn")
async def upload_chunk(
    chunk: UploadFile = File(...),
    fileName: str = Form(...),
    chunkIndex: int = Form(0),
    totalChunks: int = Form(1),
    clearAll: Optional[str] = Form(None)
):
    """
    Nhận từng mảnh 2MB của file lớn để không bị giới hạn bộ nhớ/payload.
    """
    if clearAll == "true" and chunkIndex == 0:
        for f in UPLOAD_DIR.glob("*"):
            if f.is_file():
                try: f.unlink()
                except: pass

    file_path = UPLOAD_DIR / fileName
    mode = "wb" if chunkIndex == 0 else "ab"
    with open(file_path, mode) as buffer:
        shutil.copyfileobj(chunk.file, buffer)

    return {
        "success": True,
        "message": f"Đã lưu phần {chunkIndex + 1}/{totalChunks} của file {fileName}",
        "isDone": chunkIndex == totalChunks - 1
    }

@app.post("/process", summary="Kích hoạt quá trình xử lý & tính toán KPI")
async def process_report(request: Request):
    """
    Đọc các file Excel đã tải lên (hoặc dùng dữ liệu mẫu), thực hiện mapping, tính toán KPI theo Tổ Hạ tầng
    và sinh ra file Báo cáo Excel 8 Sheet cũng như JSON Dashboard.
    """
    try:
        use_sample = False
        try:
            body = await request.json()
            if isinstance(body, dict) and body.get("use_sample"):
                use_sample = True
        except:
            pass

        input_dir = BASE_DIR / "templates" / "TTS" if use_sample else UPLOAD_DIR
        res = process_cd5(str(input_dir), str(OUTPUT_FILE), str(RESULT_JSON_FILE))
        return {
            "success": True,
            "message": "Xử lý và tính toán KPI thành công!",
            "data": res
        }
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail=str(fnf_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trong quá trình xử lý: {str(e)}")

@app.get("/result", summary="Lấy dữ liệu JSON Dashboard gần nhất")
async def get_result():
    """
    Trả về kết quả thống kê KPI gần nhất để hiển thị lên Dashboard Web App.
    """
    if not RESULT_JSON_FILE.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu báo cáo nào được tạo. Vui lòng upload và process trước.")
    
    with open(RESULT_JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        "success": True,
        "data": data
    }

@app.get("/download", summary="Tải xuống file Excel Báo cáo tổng hợp 5 Sheet")
async def download_report():
    """
    Tải về file Excel đầu ra BaoCao_XLSC_TayNinh_Updated.xlsx.
    """
    if not OUTPUT_FILE.exists():
        raise HTTPException(status_code=404, detail="File báo cáo Excel chưa tồn tại. Vui lòng thực hiện process trước.")
    
    return FileResponse(
        path=OUTPUT_FILE,
        filename="BaoCao_XLSC_TayNinh_Updated.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# ─── ENDPOINT: Xuất Báo cáo tuần dạng Word ────────────────────────────────────

@app.post("/export-word", summary="Tạo báo cáo tuần .docx từ 8 file Excel (truyền qua Blob URL)")
async def export_word(request: Request):
    """
    Nhận JSON body: { blobUrls: { mbb, fbb, mytv, mll, ispeed, "5s", xlsc, appendix } }
    Tải từng file Excel từ Vercel Blob URL → gọi generate_word_report.generate() → trả về file .docx
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body JSON không hợp lệ.")

    blob_urls: Dict[str, str] = body.get("blobUrls", {})
    REQUIRED_KEYS = ["mbb", "fbb", "mytv", "mll", "ispeed", "5s", "xlsc", "appendix"]
    missing = [k for k in REQUIRED_KEYS if k not in blob_urls or not blob_urls[k]]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Chưa đủ file Excel. Còn thiếu: {', '.join(missing)}"
        )

    # Import generate_word_report động để lấy hàm generate()
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    import generate_word_report as gwr

    # Tải file Excel vào thư mục tạm giống DATA_DIR mà generate_word_report dùng
    ROOT = Path(__file__).resolve().parents[1]
    DATA_DIR = ROOT / "data sample"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    EXCEL_KEYS = {
        "mbb":      "1. BÁO CÁO MBB_HUNG.xlsx",
        "fbb":      "2. BÁO CÁO FBB_BAO.xlsx",
        "mytv":     "3. BÁO CÁO MYTV_TÂN.xlsx",
        "mll":      "4. BÁO CÁO MLL_KHANH.xlsx",
        "ispeed":   "5. BÁO CÁO ISPEED_QUOC.xlsx",
        "5s":       "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx",
        "xlsc":     "7.BÁO CÁO XLSC_TUẤN.xlsx",
        "appendix": "PHỤ LỤC 1.xlsx",
    }

    # Tải từng file từ Blob URL về data sample/
    import httpx
    import asyncio
    
    async def download_file(client, url, filepath, key):
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            filepath.write_bytes(resp.content)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Không thể tải file '{key}' từ Vercel Blob: {str(e)}"
            )

    async with httpx.AsyncClient(timeout=120.0) as client:
        tasks = []
        for key, filename in EXCEL_KEYS.items():
            url = blob_urls.get(key)
            if not url:
                raise HTTPException(status_code=422, detail=f"Thiếu URL cho key: {key}")
            tasks.append(download_file(client, url, DATA_DIR / filename, key))
        await asyncio.gather(*tasks)

    # Tạo file output tạm
    EXPORT_DIR = ROOT / "exports"
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = EXPORT_DIR / "Bao_cao_VNPT_tuan_export.docx"

    try:
        result = gwr.generate(output=output_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Không tìm thấy template Word: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo báo cáo Word: {str(e)}")

    if not output_path.exists():
        raise HTTPException(status_code=500, detail="File Word không được tạo ra.")

    docx_bytes = output_path.read_bytes()
    week = result.get("week", "")
    filename_out = f"Bao_cao_VNPT{f'_tuan_{week}' if week else ''}.docx"

    from urllib.parse import quote
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename_out)}",
            "Content-Length": str(len(docx_bytes)),
        }
    )
@app.post("/export-word-weekly", summary="Tạo báo cáo tuần mất liên lạc .docx từ 2 file Excel")
async def export_word_weekly(request: Request):
    """
    Nhận JSON body: { blobUrls: { weekly1, weekly2 } }
    Tải 2 file Excel, gọi generate_weekly_report.export_weekly, trả về .docx.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body JSON không hợp lệ.")
    blob_urls: Dict[str, str] = body.get("blobUrls", {})
    required = ["weekly1", "weekly2"]
    missing = [k for k in required if k not in blob_urls or not blob_urls[k]]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Chưa đủ file Excel. Còn thiếu: {', '.join(missing)}",
        )
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    import generate_weekly_report as gwr
    out_path = gwr.export_weekly(blob_urls)
    docx_bytes = out_path.read_bytes()
    filename_out = out_path.name
    from urllib.parse import quote
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename_out)}",
            "Content-Length": str(len(docx_bytes)),
        },
    )

# ─── ENDPOINT: Xuất Báo cáo tháng dạng Word ───────────────────────────────────

@app.post("/export-word-monthly", summary="Tạo báo cáo tháng .docx từ 10 file Excel")
async def export_word_monthly(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body JSON không hợp lệ.")

    blob_urls: Dict[str, str] = body.get("blobUrls", {})
    REQUIRED_KEYS = ["mbb", "fbb", "mytv", "ispeed", "5s", "xlsc", "appendix", "omc_tam", "omc_nhi", "phutro_quy", "ngoaivi_bao", "ngoaivi_tuan", "cauhinh_quy"]
    missing = [k for k in REQUIRED_KEYS if k not in blob_urls or not blob_urls[k]]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Chưa đủ file Excel. Còn thiếu: {', '.join(missing)}"
        )

    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    import generate_monthly_report as gmr

    try:
        ROOT = Path(__file__).resolve().parents[1]
    except IndexError:
        ROOT = Path(__file__).resolve().parent

    DATA_DIR = ROOT / "data sample"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    EXCEL_KEYS = {
        "mbb":      "1. BÁO CÁO MBB_HUNG.xlsx",
        "fbb":      "2. BÁO CÁO FBB_BAO.xlsx",
        "mytv":     "3. BÁO CÁO MYTV_TÂN.xlsx",
        "ispeed":   "5. BÁO CÁO ISPEED_QUOC.xlsx",
        "5s":       "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx",
        "xlsc":     "7.BÁO CÁO XLSC_TUẤN.xlsx",
        "appendix": "8.PHỤ LỤC 1_HÂN.xlsx",
        "omc_tam":  "9.HIỆN TRẠNG THIẾT BỊ_TÂM.xlsx",
        "omc_nhi":  "10. BÁO CÁO BSC_NHI.xlsx",
        "phutro_quy": "11. THIẾT BỊ PHỤ TRỢ_QUÝ.xlsx",
        "ngoaivi_bao": "12. MẠNG NGOẠI VI_BẢO.xlsx",
        "ngoaivi_tuan": "13. XLSC MẠNG NGOẠI VI_TUẤN.xlsx",
        "cauhinh_quy": "14. CẤU HÌNH TỰ ĐỘNG_QUÝ.xlsx"
    }

    import httpx
    import asyncio
    
    async def download_file(client, url, filepath, key):
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            filepath.write_bytes(resp.content)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Không thể tải file '{key}': {str(e)}"
            )

    async with httpx.AsyncClient(timeout=120.0) as client:
        tasks = []
        for key, filename in EXCEL_KEYS.items():
            url = blob_urls.get(key)
            if not url:
                raise HTTPException(status_code=422, detail=f"Thiếu URL cho key: {key}")
            tasks.append(download_file(client, url, DATA_DIR / filename, key))
        await asyncio.gather(*tasks)

    EXPORT_DIR = ROOT / "exports"
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = EXPORT_DIR / "Bao_cao_VNPT_thang_export.docx"

    try:
        result = gmr.generate(output=output_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Không tìm thấy template Word: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo báo cáo Word: {str(e)}")

    if not output_path.exists():
        raise HTTPException(status_code=500, detail="File Word không được tạo ra.")

    docx_bytes = output_path.read_bytes()
    filename_out = "Bao_cao_VNPT_thang.docx"

    from urllib.parse import quote
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename_out)}",
            "Content-Length": str(len(docx_bytes)),
        }
    )

@app.post("/demo-export", summary="Demo Web Editor Export")
async def demo_export(request: DemoExportRequest):
    try:
        ROOT = Path(__file__).parent.parent
        template_path = ROOT / "templates" / "BAO_CAO" / "BÁO CÁO MẪU.docx"
        
        output_io = generate_demo_report_from_json(request, str(template_path))
        
        return Response(
            content=output_io.read(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename*=UTF-8''BAO_CAO_DEMO.docx",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("=== Khởi động FastAPI Server cho Báo Cáo Chuyên Đề 5 ===")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run("fastapi_cd5:app", host="0.0.0.0", port=8000, reload=True)
