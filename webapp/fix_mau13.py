import docx

doc_path = r'c:\Users\quyng\Documents\TOOL TỔNG HỢP BÁO CÁO\VNPT REPORT\webapp\templates\TOTRINH\13_Mau_Giay_moi.docx'
doc = docx.Document(doc_path)

for p in doc.paragraphs:
    if p.text.startswith('Chủ trì:'):
        p.text = 'Chủ trì: (CHUTRI)'
    elif p.text.startswith('Thời gian:'):
        p.text = 'Thời gian: (THOIGIAN)'

doc.save(doc_path)
print('Fixed Mẫu 13')
