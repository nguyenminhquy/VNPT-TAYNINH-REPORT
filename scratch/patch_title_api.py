import os
import glob
import re

api_dirs = glob.glob('webapp/app/api/export-*')
for api_dir in api_dirs:
    route_file = os.path.join(api_dir, 'route.ts')
    if os.path.exists(route_file):
        with open(route_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # We want to replace the title regex. 
        # Usually looks like: doc.replaceTextInEntireDocument(/.*Về việc.*\(\s*3\s*\).*/, title.trim() ? title : 'Về việc...');
        # We just need to inject a new doc.replaceTextInEntireDocument(/\(\s*TITLE\s*\)/i, ...) after the existing title check.
        # Let's find "doc.replaceTextInEntireDocument(.*title.trim().*?);"
        
        if 'TITLE' not in content and 'title' in content:
            # We'll use a regex to find the title replacement and inject the TITLE tag replacement
            new_content = re.sub(
                r"(doc\.replaceTextInEntireDocument\(.*?(?:Về việc|T[Oờ] TR[Iì]NH|title\.trim\(\)).*?;\n)",
                r"\1      doc.replaceTextInEntireDocument(/\\(\\s*TITLE\\s*\\)/i, title.trim() ? title : '..............................');\n",
                content,
                flags=re.IGNORECASE
            )
            if new_content != content:
                with open(route_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Patched {route_file}")
            else:
                print(f"Regex didn't match in {route_file}")
