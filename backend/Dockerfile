FROM python:3.12-slim

WORKDIR /app

# Set encoding & time zone
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Ho_Chi_Minh

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Tạo thư mục exports chứa kết quả xử lý và copy templates ra root /templates nếu có
RUN mkdir -p ../exports/cd5_uploads ../templates/TTS && cp -r templates/* ../templates/ 2>/dev/null || true

EXPOSE 8000

CMD ["uvicorn", "fastapi_cd5:app", "--host", "0.0.0.0", "--port", "8000"]
