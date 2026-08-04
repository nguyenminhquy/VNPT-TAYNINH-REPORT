import re

new_logic = '''      let t = title.trim();
      if (t) {
        if (!/^V\\\/v\\s/i.test(t)) {
          t = 'V/v ' + t;
        }
      } else {
        t = 'V/v ..........................................................';
      }
      doc.replaceTextInEntireDocument(/.*\\(\\s*3\\s*\\).*/, t);'''

for file_path in ['webapp/app/api/export-3a/route.ts', 'webapp/app/api/export-3b/route.ts']:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The regex to find the replace block
    # It looks like: doc.replaceTextInEntireDocument(/.*\(\s*3\s*\).*/, title.trim() ? title : '..........................................................');
    content = re.sub(r"doc\.replaceTextInEntireDocument\(/.*\\\(\\s\*3\\s\*\\\)\.*/,\s*title\.trim\(\)\s*\?\s*title\s*:\s*'[^']+'\);", new_logic, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done!')
