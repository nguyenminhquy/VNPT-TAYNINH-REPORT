import docx
import sys

doc_path = r'c:\Users\quyng\Documents\TOOL TỔNG HỢP BÁO CÁO\VNPT REPORT\webapp\templates\TOTRINH\11_Mau_Giay_trieu_tap.docx'
doc = docx.Document(doc_path)

for p in doc.paragraphs:
    if p.text.strip() == '(4)':
        p.text = '(CONTENT)'

doc.save(doc_path)
