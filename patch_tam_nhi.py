import re
with open('backend/generate_monthly_report.py', 'r', encoding='utf-8') as f:
    content = f.read()

def get_update_tam_nhi_code():
    return '''def update_tam_nhi(document: DocumentType, sources: dict[str, Any]) -> None:
    def extract_dynamic(wb, sheet_name, tag):
        try:
            sheet = wb[sheet_name]
            t = find_table_by_tag(document, tag)
            if not t: return
            
            num_cols = len(t.rows[0].cells)
            
            start_row = None
            start_col = None
            for row_idx, row in enumerate(sheet.iter_rows(values_only=True), 1):
                for col_idx, cell in enumerate(row, 1):
                    if isinstance(cell, str) and ("Tây Ninh" in cell or "TAy Ninh" in cell.replace('â','a')):
                        start_row = row_idx
                        start_col = col_idx
                        break
                if start_row: break
            
            if not start_row:
                print(f"Could not find 'Tây Ninh' in {sheet_name}")
                return
                
            matrix = []
            for row_idx, row in enumerate(sheet.iter_rows(min_row=start_row, max_col=start_col + num_cols - 1, values_only=True), start_row):
                val = row[start_col - 1]
                if val is None or str(val).strip() == "":
                    break
                matrix.append(list(row[start_col - 1 : start_col - 1 + num_cols]))
                
            word_start_row = 1
            for i in range(len(t.rows)):
                row_text = " ".join(c.text for c in t.rows[i].cells)
                if "Tây Ninh" in row_text or "Tân An" in row_text or "TAy Ninh" in row_text.replace('â','a'):
                    word_start_row = i
                    break
                    
            write_table_matrix(t, matrix, start_row=word_start_row)
            print(f"Successfully wrote {tag} dynamically")
        except Exception as e:
            print(f"Error {tag}:", e)

    if "omc_nhi" in sources:
        try:
            wb = sources["omc_nhi"]
            extract_dynamic(wb, "BANG 1 ", "B8_NHI")
            extract_dynamic(wb, "BANG3", "B9_NHI")
        except Exception as e:
            print("Error processing omc_nhi:", e)
            
    if "omc_tam" in sources:
        try:
            wb = sources["omc_tam"]
            mapping = {
                "01_MANE_CSG": "B1_TAM",
                "02_OLT": "B2_TAM",
                "03_L2SW": "B3_TAM",
                "05_3G": "B4_TAM",
                "06_4G": "B5_TAM",
                "07_5G": "B6_TAM",
                "08_DLU": "B7_TAM"
            }
            for sheet_name, tag in mapping.items():
                extract_dynamic(wb, sheet_name, tag)
        except Exception as e:
            print("Error processing omc_tam:", e)'''

pattern = re.compile(r'def update_tam_nhi\(.*?Error processing omc_tam:.*?e\)', re.DOTALL)
new_content = pattern.sub(get_update_tam_nhi_code().strip(), content)

with open('backend/generate_monthly_report.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Patched successfully!')
