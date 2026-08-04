import re

with open('webapp/app/api/export-10/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

search = """    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', '10_Mau_Chi_thi.docx');"""

replace = """    const isPGD = role && role.includes('PHÓ GIÁM ĐỐC');
    const templateFileName = isPGD ? '10_Mau_Chi_thi_PGD.docx' : '10_Mau_Chi_thi.docx';
    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', templateFileName);"""

if search in content:
    content = content.replace(search, replace)
    with open('webapp/app/api/export-10/route.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("PGD logic added")
else:
    print("Search string not found")
