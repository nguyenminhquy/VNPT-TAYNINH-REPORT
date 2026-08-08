import requests
import json
import traceback

base_url = "http://localhost:3000/api"

payloads = {
    "export-totrinh": {
        "title": "Test Title",
        "docNumber": "123",
        "docDate": "01/01/2026",
        "to": "Test To",
        "baseClause": "Test Base",
        "content": "Test Content",
        "proposal": "Test Proposal",
        "recipients": "Test Recipients",
        "author": "Test Author",
        "manager": "Test Manager",
        "role": "GIÁM ĐỐC"
    },
    "export-maubaocao": {
        "title": "Test Report",
        "content": "Report Content",
        "role": "GIÁM ĐỐC",
        "signerName": "Nguyen Van A",
        "unit6": "HT",
        "author7": "NVA",
        "eoffice8": "12345"
    },
    "export-04": {
        "title": "Test 04",
        "content": "Content 04",
        "role": "GIÁM ĐỐC",
        "signerName": "Nguyen Van B",
        "unit6": "HT",
        "author7": "NVB",
        "eoffice8": "234"
    },
    "export-05": {
        "title": "Test 05",
        "bases": "Base 1",
        "article1": "Article 1",
        "role": "GIÁM ĐỐC",
        "signerName": "Nguyen Van C",
        "unit8": "HT",
        "author9": "NVC"
    },
    "export-09": {
        "nguoiUyQuyen": "A",
        "nguoiDuocUyQuyen": "B",
        "bases": ["Base 1"],
        "articles": ["Article 1"],
        "role": "GIÁM ĐỐC",
        "signerName": "C",
        "unit8": "HT",
        "author9": "D"
    },
    "export-10": {
        "title": "Test 10",
        "bases": ["Base 1"],
        "articles": ["Article 1"],
        "role": "GIÁM ĐỐC",
        "signerName": "C",
        "unit6": "HT",
        "author7": "D",
        "eoffice8": "1"
    },
    "export-11": {
        "title": "Test 11",
        "bases": ["Base 1"],
        "articles": ["Article 1"],
        "role": "GIÁM ĐỐC",
        "signerName": "C",
        "unit6": "HT",
        "author7": "D",
        "eoffice8": "1"
    },
    "export-13": {
        "title": "Test 13",
        "donViBanHanh": "HT",
        "nguoiDuocMoi": "A",
        "tenCuocHop": "Họp",
        "chuTri": "B",
        "thoiGian": "Nay",
        "diaDiem": "Đây",
        "luuY": "Không",
        "role": "GIÁM ĐỐC",
        "signerName": "C",
        "unit10": "HT",
        "author11": "D",
        "eoffice12": "1"
    },
    "export-3a": {
        "title": "Test 3a",
        "to": "A",
        "content": "B",
        "role": "GIÁM ĐỐC",
        "signerName": "C",
        "unit6": "HT",
        "author7": "D",
        "eoffice8": "1"
    },
    "export-3b": {
        "title": "Test 3b",
        "to": "A",
        "content": "B",
        "role": "GIÁM ĐỐC",
        "signerName": "C",
        "unit6": "HT",
        "author7": "D",
        "eoffice8": "1"
    }
}

print("Testing endpoints...")
for endpoint, payload in payloads.items():
    try:
        url = f"{base_url}/{endpoint}"
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            print(f"[OK] {endpoint}")
        else:
            print(f"[FAIL] {endpoint} - Status {res.status_code}")
            print(res.text)
    except Exception as e:
        print(f"[ERROR] {endpoint} - {str(e)}")

print("Done")
