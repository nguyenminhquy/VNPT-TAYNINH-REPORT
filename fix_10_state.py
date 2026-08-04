import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will add form10 after form5 or similar to be safe.
search_state = "  const [form5, setForm5] = useState({"
replace_state = "  const [form10, setForm10] = useState({ title: '', content: '', role: 'GIÁM ĐỐC', signerName: '', unit6: '', author7: '', eoffice8: '' });\n  const [form5, setForm5] = useState({"

if search_state in content:
    content = content.replace(search_state, replace_state)
    with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("State form10 added.")
else:
    print("Could not find search_state")
