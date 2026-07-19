from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import threading
import uuid
import zipfile
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT / "frontend"
DATA_DIR = ROOT / "data sample"
GENERATOR = Path(__file__).with_name("generate_report_data.py")
WORD_GENERATOR = Path(__file__).with_name("generate_word_report.py")
OUTPUT_FILE = FRONTEND_DIR / "data" / "report-data.js"
WORD_TEMPLATE = ROOT / "templates" / "TTHT Báo cáo công việc tuần 29.docx"
EXPORT_DIR = ROOT / "exports"
MAX_UPLOAD_BYTES = 25 * 1024 * 1024

REPORTS: dict[str, dict[str, str]] = {
    "mbb": {
        "label": "BÁO CÁO MBB_HUNG",
        "owner": "Hưng",
        "filename": "1. BÁO CÁO MBB_HUNG.xlsx",
    },
    "fbb": {
        "label": "BÁO CÁO FBB_BAO",
        "owner": "Bảo",
        "filename": "2. BÁO CÁO FBB_BAO.xlsx",
    },
    "mytv": {
        "label": "BÁO CÁO MYTV_TÂN",
        "owner": "Tân",
        "filename": "3. BÁO CÁO MYTV_TÂN.xlsx",
    },
    "mll": {
        "label": "BÁO CÁO MLL_KHANH",
        "owner": "Khánh",
        "filename": "4. BÁO CÁO MLL_KHANH.xlsx",
    },
    "ispeed": {
        "label": "BÁO CÁO ISPEED_QUOC",
        "owner": "Quốc",
        "filename": "5. BÁO CÁO ISPEED_QUOC.xlsx",
    },
    "5s": {
        "label": "BÁO CÁO 5S NHÀ TRẠM_TÂN",
        "owner": "Tân",
        "filename": "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx",
    },
    "xlsc": {
        "label": "BÁO CÁO XLSC_TUẤN",
        "owner": "Tuấn",
        "filename": "7.BÁO CÁO XLSC_TUẤN.xlsx",
    },
    "appendix": {
        "label": "PHỤ LỤC 1",
        "owner": "Phụ lục",
        "filename": "PHỤ LỤC 1.xlsx",
    },
}

UPLOAD_LOCK = threading.Lock()


def file_status(report_id: str, report: dict[str, str]) -> dict[str, Any]:
    path = DATA_DIR / report["filename"]
    status: dict[str, Any] = {
        "id": report_id,
        "label": report["label"],
        "owner": report["owner"],
        "filename": report["filename"],
        "exists": path.is_file(),
    }

    if path.is_file():
        stat = path.stat()
        status.update(
            {
                "size": stat.st_size,
                "updatedAt": datetime.fromtimestamp(stat.st_mtime).astimezone().isoformat(
                    timespec="seconds"
                ),
            }
        )

    return status


def validate_workbook(path: Path) -> None:
    if not zipfile.is_zipfile(path):
        raise ValueError("Tệp tải lên không phải workbook Excel .xlsx hợp lệ.")

    with zipfile.ZipFile(path) as workbook:
        names = set(workbook.namelist())
        required = {"[Content_Types].xml", "xl/workbook.xml"}
        if not required.issubset(names):
            raise ValueError("Tệp Excel thiếu cấu trúc workbook bắt buộc.")


class ReportRequestHandler(SimpleHTTPRequestHandler):
    server_version = "VNPTReportServer/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/reports":
            reports = [file_status(key, value) for key, value in REPORTS.items()]
            self.send_json(
                HTTPStatus.OK,
                {
                    "reports": reports,
                    "wordTemplateReady": WORD_TEMPLATE.is_file(),
                    "canExportWord": WORD_TEMPLATE.is_file()
                    and all(report["exists"] for report in reports),
                },
            )
            return

        super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/export-word":
            try:
                export = self.build_word_report()
            except subprocess.TimeoutExpired:
                self.send_json(
                    HTTPStatus.GATEWAY_TIMEOUT,
                    {"error": "Quá trình tạo báo cáo Word vượt quá 300 giây."},
                )
            except (FileNotFoundError, ValueError) as error:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            except Exception as error:
                self.send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {"error": f"Không thể tạo báo cáo Word: {error}"},
                )
            else:
                self.send_docx(export)
            return

        prefix = "/api/reports/"
        if not path.startswith(prefix):
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Không tìm thấy API."})
            return

        report_id = path.removeprefix(prefix).strip("/")
        report = REPORTS.get(report_id)
        if report is None:
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Loại báo cáo không hợp lệ."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        if content_length <= 0:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Tệp tải lên đang trống."})
            return

        if content_length > MAX_UPLOAD_BYTES:
            self.send_json(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                {"error": "Tệp vượt quá giới hạn 25 MB."},
            )
            return

        original_name = unquote(self.headers.get("X-File-Name", "report.xlsx"))
        if Path(original_name).suffix.lower() != ".xlsx":
            self.send_json(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                {"error": "Chỉ chấp nhận tệp Excel định dạng .xlsx."},
            )
            return

        payload = self.rfile.read(content_length)
        try:
            result = self.replace_report(report_id, report, payload)
        except ValueError as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except subprocess.TimeoutExpired:
            self.send_json(
                HTTPStatus.GATEWAY_TIMEOUT,
                {"error": "Quá trình tổng hợp dữ liệu vượt quá 180 giây."},
            )
        except Exception as error:
            self.send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"error": f"Không thể cập nhật báo cáo: {error}"},
            )
        else:
            self.send_json(HTTPStatus.OK, result)

    def replace_report(
        self, report_id: str, report: dict[str, str], payload: bytes
    ) -> dict[str, Any]:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        target = DATA_DIR / report["filename"]
        token = uuid.uuid4().hex
        incoming = DATA_DIR / f".{target.name}.{token}.upload"
        backup = DATA_DIR / f".{target.name}.{token}.backup"
        output_backup = OUTPUT_FILE.with_name(f".{OUTPUT_FILE.name}.{token}.backup")

        with UPLOAD_LOCK:
            incoming.write_bytes(payload)
            try:
                validate_workbook(incoming)
                had_original = target.exists()
                had_output = OUTPUT_FILE.exists()
                if had_original:
                    os.replace(target, backup)
                if had_output:
                    shutil.copy2(OUTPUT_FILE, output_backup)

                try:
                    os.replace(incoming, target)
                    child_environment = os.environ.copy()
                    child_environment["PYTHONIOENCODING"] = "utf-8"
                    process = subprocess.run(
                        [sys.executable, str(GENERATOR)],
                        cwd=ROOT,
                        env=child_environment,
                        capture_output=True,
                        text=True,
                        encoding="utf-8",
                        errors="replace",
                        timeout=180,
                        check=False,
                    )
                    if process.returncode != 0:
                        detail = (process.stderr or process.stdout or "Lỗi không xác định").strip()
                        raise ValueError(
                            "Không đọc được cấu trúc báo cáo mới. Dữ liệu cũ đã được giữ lại. "
                            + detail[-800:]
                        )
                except Exception:
                    if target.exists():
                        target.unlink()
                    if had_original and backup.exists():
                        os.replace(backup, target)
                    if OUTPUT_FILE.exists():
                        OUTPUT_FILE.unlink()
                    if had_output and output_backup.exists():
                        os.replace(output_backup, OUTPUT_FILE)
                    raise
                else:
                    if backup.exists():
                        backup.unlink()
                    if output_backup.exists():
                        output_backup.unlink()
            finally:
                if incoming.exists():
                    incoming.unlink()

        status = file_status(report_id, report)
        return {
            "message": f"Đã cập nhật {report['label']} và tổng hợp lại dashboard.",
            "report": status,
        }

    def build_word_report(self) -> Path:
        reports = [file_status(key, value) for key, value in REPORTS.items()]
        missing = [report["label"] for report in reports if not report["exists"]]
        if missing:
            raise ValueError("Chưa đủ 8 nguồn Excel: " + ", ".join(missing))
        if not WORD_TEMPLATE.is_file():
            raise FileNotFoundError("Không tìm thấy mẫu Word trong thư mục templates.")

        child_environment = os.environ.copy()
        child_environment["PYTHONIOENCODING"] = "utf-8"
        with UPLOAD_LOCK:
            process = subprocess.run(
                [sys.executable, str(WORD_GENERATOR)],
                cwd=ROOT,
                env=child_environment,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=300,
                check=False,
            )

        if process.returncode != 0:
            detail = (process.stderr or process.stdout or "Lỗi không xác định").strip()
            raise ValueError("Không tạo được báo cáo Word. " + detail[-1200:])

        lines = [line for line in process.stdout.splitlines() if line.strip()]
        if not lines:
            raise ValueError("Bộ tạo Word không trả về thông tin tệp xuất.")
        try:
            result = json.loads(lines[-1])
            output = Path(result["path"]).resolve()
        except (json.JSONDecodeError, KeyError, TypeError) as error:
            raise ValueError("Không đọc được kết quả từ bộ tạo Word.") from error

        export_root = EXPORT_DIR.resolve()
        if export_root not in output.parents or not output.is_file():
            raise ValueError("Tệp Word xuất ra không hợp lệ.")
        return output

    def send_docx(self, path: Path) -> None:
        body = path.read_bytes()
        encoded_name = quote(path.name)
        self.send_response(HTTPStatus.OK.value)
        self.send_header(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        self.send_header(
            "Content-Disposition",
            f"attachment; filename=VNPT-report.docx; filename*=UTF-8''{encoded_name}",
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve VNPT Report Hub with upload API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=4173, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), ReportRequestHandler)
    print(f"VNPT Report Hub running at http://{args.host}:{args.port}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
