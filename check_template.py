import sys
import docx

sys.stdout.reconfigure(encoding='utf-8')
path = r"c:\Users\quyng\Documents\TOOL TỔNG HỢP BÁO CÁO\VNPT REPORT\templates\BAO_CAO\BÁO CÁO MẪU.docx"
doc = docx.Document(path)
with open('check_out_all.txt', 'w', encoding='utf-8') as f:
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if text:
            f.write(f"Para {i}: {text}\n")
