import os
import glob
import re

api_dirs = glob.glob('webapp/app/api/export-*')
for api_dir in api_dirs:
    route_file = os.path.join(api_dir, 'route.ts')
    if os.path.exists(route_file):
        with open(route_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Look for the signerName replacement block
        # Usually it looks like:
        # doc.replaceTextInEntireDocument(/.*Họ và tên.*/i, signerName.trim() ? signerName : '..............................');
        # or similar.
        # We can just inject the new replacement after it.
        
        if 'SIGNER' not in content and 'signerName' in content:
            new_content = re.sub(
                r"(doc\.replaceTextInEntireDocument\(/.*H[oọ].*v[aà].*t[eê]n.*i,\s*signerName.*?;\n)",
                r"\1      doc.replaceTextInEntireDocument(/\\(\\s*SIGNER\\s*\\)/i, signerName.trim() ? signerName : 'Họ và tên');\n",
                content,
                flags=re.IGNORECASE
            )
            if new_content != content:
                with open(route_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Patched {route_file}")
            else:
                print(f"Regex didn't match in {route_file}")
