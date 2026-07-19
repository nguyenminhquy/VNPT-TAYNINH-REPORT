# VNPT Weekly Report Hub

Landing page tổng hợp báo cáo tuần từ các file Excel trong thư mục `data sample`.

## Cấu trúc chính

- `backend/generate_report_data.py`: đọc các file Excel và sinh dữ liệu web.
- `backend/generate_word_report.py`: cập nhật các vùng dữ liệu cần thiết vào mẫu Word.
- `frontend/index.html`: trang landing page.
- `frontend/data/report-data.js`: dữ liệu được sinh tự động từ Excel.
- `templates/TTHT Báo cáo công việc tuần 29.docx`: mẫu Word được giữ nguyên để xuất báo cáo.
- `exports/`: các file Word đã tạo.

## Cập nhật dữ liệu

1. Thay các file Excel mới vào thư mục `data sample`.
2. Cài thư viện nếu cần:

```powershell
pip install -r backend/requirements.txt
```

3. Sinh lại dữ liệu:

```powershell
python backend/generate_report_data.py
```

## Chạy local và nhập dữ liệu từ web

```powershell
python backend/server.py
```

Sau đó mở `http://127.0.0.1:4173`. Nút **Nhập dữ liệu** cho phép cập nhật 8 file Excel; máy chủ sẽ kiểm tra file, chạy lại bộ tổng hợp và tự hoàn tác nếu cấu trúc báo cáo không hợp lệ.

Khi đủ 8 nguồn, nút **Xuất báo cáo Word** tạo một file `.docx` mới trong `exports/` và tải file xuống trình duyệt. Bộ xuất chỉ đọc những vùng Excel đang được dùng trong mẫu Word, giữ nguyên bố cục và chuyển các liên kết Excel cũ thành dữ liệu tĩnh.
