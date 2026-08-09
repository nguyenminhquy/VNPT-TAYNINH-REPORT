import re

with open('backend/generate_monthly_report.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add extract_dynamic_table at the module level (after remove_tags or similar)
extract_func = '''def extract_dynamic_table(document: DocumentType, sheet: Any, tag: str, anchor_text: str = None, start_col_idx: int = 1, apply_formatting=None, word_start_row=None, row_offset=0) -> None:
    t = find_table_by_tag(document, tag)
    if not t: return
    
    num_cols = len(t.rows[0].cells)
    
    start_row = None
    start_col = None
    for row_idx, row in enumerate(sheet.iter_rows(values_only=True), 1):
        for col_idx, cell in enumerate(row, 1):
            if isinstance(cell, str):
                if anchor_text and (anchor_text in cell or anchor_text.replace('â','a') in cell.replace('â','a')):
                    start_row = row_idx
                    start_col = start_col_idx
                    break
                elif not anchor_text and tag in cell:
                    start_row = row_idx
                    start_col = start_col_idx
                    break
        if start_row: break
    
    if not start_row: return
    
    start_row += row_offset
        
    matrix = []
    for row_idx, row in enumerate(sheet.iter_rows(min_row=start_row, max_col=start_col + num_cols - 1, values_only=True), start_row):
        if all(c is None or str(c).strip() == "" for c in row[start_col - 1 : start_col - 1 + num_cols]):
            break
        row_data = list(row[start_col - 1 : start_col - 1 + num_cols])
        if apply_formatting:
            row_data = apply_formatting(row_data, row_idx - start_row)
        matrix.append(row_data)
        
    if word_start_row is None:
        word_start_row = 1
        for i in range(len(t.rows)):
            row_text = " ".join(c.text for c in t.rows[i].cells)
            if anchor_text and (anchor_text in row_text or anchor_text.replace('â','a') in row_text.replace('â','a')):
                word_start_row = i
                break
                
    try:
        write_table_matrix(t, matrix, start_row=word_start_row)
        print(f"Successfully wrote {tag} dynamically")
    except Exception as e:
        print(f"Error {tag}:", e)

'''
if 'def extract_dynamic_table' not in content:
    content = content.replace('def remove_tags', extract_func + 'def remove_tags')

# 2. Rewrite update_mbb_fbb_mytv
mbb_func = '''def update_mbb_fbb_mytv(document: DocumentType, sources: dict[str, Any]) -> None:
    mbb = sources.get("mbb")
    fbb = sources.get("fbb")
    mytv = sources.get("mytv")

    if mbb:
        try:
            def fmt_b15(row, idx):
                if idx > 0:
                    row[2] = decimal(row[2]) if len(row) > 2 else row[2]
                    row[3] = decimal(row[3]) if len(row) > 3 else row[3]
                return row
            extract_dynamic_table(document, mbb["Kết quả chung"], "B15_HUNG", "Toàn quốc", apply_formatting=fmt_b15, word_start_row=1)
        except Exception as e: print("mbb 15:", e)

        try:
            extract_dynamic_table(document, mbb["So sánh các tỉnh"], "B16_HUNG", "Thanh Hóa", word_start_row=1)
        except Exception as e: print("mbb 16:", e)

        try:
            extract_dynamic_table(document, mbb["Kết quả chi tiết"], "B17_HUNG", "MBB QoS", word_start_row=1)
        except Exception as e: print("mbb 17:", e)

    if fbb:
        try:
            extract_dynamic_table(document, fbb["Thông tin chung"], "B18_BAO", "FBB QoS", word_start_row=1)
            extract_dynamic_table(document, fbb["Thông tin chung"], "B19_BAO", "FBB QoE", word_start_row=1)
        except Exception as e: print("fbb:", e)

    if mytv:
        try:
            def fmt_mytv(row, idx):
                if len(row) >= 8:
                    total = row[6]
                    return [clean(row[0]), clean(row[1]), clean(row[3]), clean(row[4]), clean(row[5]), clean(total), evaluate_target(total), clean(row[7])]
                return row
            extract_dynamic_table(document, mytv["Sheet1"], "B14", "MyTV QoS", start_col_idx=1, apply_formatting=fmt_mytv, word_start_row=1)
            extract_dynamic_table(document, mytv["Sheet1"], "B21_TAN", "MyTV QoS", start_col_idx=1, apply_formatting=fmt_mytv, word_start_row=1)
        except Exception as e: print("mytv:", e)
'''
content = re.sub(r'def update_mbb_fbb_mytv\(.*?(?=\ndef mll_table_matrix)', mbb_func, content, flags=re.DOTALL)

# 3. Rewrite update_ispeed
ispeed_func = '''def update_ispeed(document: DocumentType, sources: dict[str, Any]) -> None:
    if "ispeed" not in sources: return
    try:
        extract_dynamic_table(document, sources["ispeed"]["Báo cáo"], "B22_QUOC", "Tân Ninh", start_col_idx=2, word_start_row=1)
    except Exception as e:
        print("Error ispeed:", e)
'''
content = re.sub(r'def update_ispeed\(.*?(?=\ndef update_5s)', ispeed_func, content, flags=re.DOTALL)

# 4. Rewrite update_5s
s5_func = '''def update_5s(document: DocumentType, sources: dict[str, Any]) -> None:
    if "5s" not in sources: return
    try:
        extract_dynamic_table(document, sources["5s"]["Sheet1"], "B23_TAN", "5S NHÀ TRẠM", start_col_idx=1, word_start_row=1, row_offset=2)
        extract_dynamic_table(document, sources["5s"]["Sheet1"], "B24_TAN", "MÁY LẠNH", start_col_idx=1, word_start_row=1, row_offset=2)
        extract_dynamic_table(document, sources["5s"]["Sheet1"], "B25_TAN", "AP/OTB", start_col_idx=1, word_start_row=1, row_offset=2)
    except Exception as e:
        print("Error 5s:", e)
'''
content = re.sub(r'def update_5s\(.*?(?=\ndef extract_by_tag_in_sheet)', s5_func, content, flags=re.DOTALL)

with open('backend/generate_monthly_report.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched generate_monthly_report.py")
