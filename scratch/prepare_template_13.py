import docx
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

for name in ['13_Mau_Giay_moi.docx', '13_Mau_Giay_moi_PGD.docx']:
    template_path = os.path.join('templates/TOTRINH', name)
    doc = docx.Document(template_path)

    for p in doc.paragraphs:
        if 'Chủ trì:' in p.text:
            p.text = 'Chủ trì: (CHUTRI)'
        elif 'Thời gian:' in p.text:
            p.text = 'Thời gian: (TIME)'

    doc.save(template_path)
    print(f"Updated {name} successfully!")
