"""
Script kiểm tra cấu trúc template.docx:
- Liệt kê tất cả các bảng + text tiêu đề trước mỗi bảng
- Liệt kê tất cả đoạn văn (paragraph) có vị trí index
- Tìm các placeholder cần thay thế
"""

import zipfile
import re
from xml.etree import ElementTree as ET

TEMPLATE_PATH = r"c:\Users\quyng\Documents\TOOL TỔNG HỢP BÁO CÁO\VNPT REPORT\webapp\templates\template.docx"

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

def get_text(elem):
    texts = []
    for t in elem.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
        texts.append(t.text or '')
    return ''.join(texts).strip()

def main():
    with zipfile.ZipFile(TEMPLATE_PATH, 'r') as z:
        xml_str = z.read('word/document.xml')

    root = ET.fromstring(xml_str)
    body = root.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')

    children = list(body)
    paragraphs = []
    tables = []

    print("=" * 80)
    print("DANH SÁCH TẤT CẢ ĐOẠN VĂN (PARAGRAPH) - INDEX và NỘI DUNG")
    print("=" * 80)

    para_index = 0
    elem_index = 0
    for child in children:
        tag = child.tag.split('}')[-1]
        if tag == 'p':
            text = get_text(child)
            paragraphs.append((para_index, elem_index, text))
            if text:
                print(f"  Para[{para_index:3d}] | Elem[{elem_index:3d}] | {text[:120]}")
            para_index += 1
        elif tag == 'tbl':
            tables.append((len(tables), elem_index, child))
            print(f"  >>> TABLE #{len(tables)-1} <<< | Elem[{elem_index:3d}]")
        elem_index += 1

    print()
    print("=" * 80)
    print("DANH SÁCH TẤT CẢ BẢNG - NỘI DUNG Ô ĐẦU TIÊN và HEADER PARAGRAPH TRƯỚC ĐÓ")
    print("=" * 80)

    for tbl_idx, (tbl_no, tbl_elem_idx, tbl) in enumerate(tables):
        # Find preceding paragraph text
        preceding = []
        for para_no, elem_idx, text in reversed(paragraphs):
            if elem_idx < tbl_elem_idx and text:
                preceding.append(text)
                if len(preceding) >= 3:
                    break

        # Get all rows
        rows = tbl.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr')
        first_row_text = ''
        if rows:
            first_row_text = get_text(rows[0])[:100]

        print(f"\n[Bảng #{tbl_no}]")
        print(f"  Dòng đầu tiên : {first_row_text}")
        print(f"  Para trước    : {preceding[0][:80] if preceding else '(none)'}")
        if len(preceding) > 1:
            print(f"  Para -2       : {preceding[1][:80]}")
        if len(preceding) > 2:
            print(f"  Para -3       : {preceding[2][:80]}")
        print(f"  Số hàng       : {len(rows)}")

    print()
    print("=" * 80)
    print("TÌM CÁC PLACEHOLDER REGEX CẦN THAY THẾ TRONG PARAGRAPH")
    print("=" * 80)
    keywords = [
        'tuần', 'năm', 'tổng thời gian', 'mll trung bình', 'tht có thời gian',
        'thời gian lấy báo cáo', 'công tác đo kiểm', 'đánh giá thời gian',
        'nguyên nhân chi tiết', 'trên đây là', 'v/v thực hiện',
        'mll do lỗi', 'kết quả mẫu đo', 'kết quả phiếu',
        'kỳ báo cáo', 'tổng phiếu giao', 'hoàn thành', 'phiếu tồn',
        'tây ninh, ngày'
    ]
    for para_no, elem_idx, text in paragraphs:
        low = text.lower()
        for kw in keywords:
            if kw in low:
                print(f"  Para[{para_no:3d}]: {text[:100]}")
                break

if __name__ == '__main__':
    main()
