import re

with open('backend/generate_monthly_report.py', 'r', encoding='utf-8') as f:
    content = f.read()

tam_nhi_func = '''def update_tam_nhi(document: DocumentType, sources: dict[str, Any]) -> None:
    if "omc_nhi" in sources:
        try:
            wb = sources["omc_nhi"]
            extract_dynamic_table(document, wb["BANG 1 "], "B8_NHI", anchor_text=None, start_col_idx=1, word_start_row=1)
            extract_dynamic_table(document, wb["BANG3"], "B9_NHI", anchor_text=None, start_col_idx=1, word_start_row=1)
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
                extract_dynamic_table(document, wb[sheet_name], tag, anchor_text="Tây Ninh", start_col_idx=2, word_start_row=1)
        except Exception as e:
            print("Error processing omc_tam:", e)
'''

content = re.sub(r'def update_tam_nhi\(.*?(?=\ndef update_appendix)', tam_nhi_func, content, flags=re.DOTALL)

with open('backend/generate_monthly_report.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched update_tam_nhi in generate_monthly_report.py")
