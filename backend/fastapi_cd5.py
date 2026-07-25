import os
import shutil
import json
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from process_cd5 import process_cd5

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
async def process_report():
    """
    Đọc các file Excel đã tải lên, thực hiện mapping, tính toán KPI theo Tổ Hạ tầng
    và sinh ra file Báo cáo Excel 5 Sheet cũng như JSON Dashboard.
    """
    try:
        res = process_cd5(str(UPLOAD_DIR), str(OUTPUT_FILE), str(RESULT_JSON_FILE))
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
    return data

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

if __name__ == "__main__":
    print("=== Khởi động FastAPI Server cho Báo Cáo Chuyên Đề 5 ===")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run("fastapi_cd5:app", host="0.0.0.0", port=8000, reload=True)
