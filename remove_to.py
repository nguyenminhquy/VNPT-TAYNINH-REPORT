import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r"<div[^>]*>\s*<label[^>]*>Nơi nhận \(Kính gửi\).*?</label>\s*<textarea value=\{form4\.to\}[^>]*/>\s*</div>", re.DOTALL)
content = pattern.sub('', content)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
