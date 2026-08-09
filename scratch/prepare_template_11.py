import docx
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

template_path = 'templates/TOTRINH/11_Mau_Giay_trieu_tap.docx'
doc = docx.Document(template_path)

for p in doc.paragraphs:
    if ' - Thời gian: (4)' in p.text:
        p.text = ' - Thời gian: (TIME)'
    elif ' - Địa điểm: (5)' in p.text:
        p.text = ' - Địa điểm: (LOCATION)'
    elif ' (6)' in p.text:
        p.text = ' (PARTICIPANTS)'
    elif ' (7)' in p.text:
        p.text = ' (ORGANIZATION)'

doc.save(template_path)
print("Updated template 11 tags successfully!")
