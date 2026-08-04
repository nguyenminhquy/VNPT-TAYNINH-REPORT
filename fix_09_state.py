import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """  const [form3a, setForm3a] = useState({"""
replace = """  const [form9, setForm9] = useState({
    nguoiUyQuyen: '',
    nguoiDuocUyQuyen: '',
    noiDungUyQuyen: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });

  const [form3a, setForm3a] = useState({"""

content = content.replace(search, replace)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added form9 declaration")
