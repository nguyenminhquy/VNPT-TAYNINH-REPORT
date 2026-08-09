import sys; sys.stdout.reconfigure(encoding='utf-8')
from docx import Document
doc = Document('data sample/DATA SAMPLE THANG/BÁO CÁO THÁNG 7_ ĐỊNH HƯỚNG THÁNG 8.docx')
t_idx = -1
table_counter = 0
for element in doc.element.body:
    if element.tag.endswith('p') and element.text and 'B1_TAM' in element.text:
        t_idx = table_counter
        break
    elif element.tag.endswith('tbl'):
        table_counter += 1
if t_idx != -1:
    t = doc.tables[t_idx]
    with open('output_tam.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(' | '.join(c.text.strip().replace('\n', ' ') for c in r.cells) for r in t.rows))
