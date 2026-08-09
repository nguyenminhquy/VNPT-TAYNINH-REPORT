import os
import glob

api_dirs = glob.glob('webapp/app/api/export-*')
for api_dir in api_dirs:
    route_file = os.path.join(api_dir, 'route.ts')
    if os.path.exists(route_file):
        with open(route_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # We look for where `doc.replaceTextInEntireDocument(/\(\s*3\s*\)/, t);` or similar happens for title.
        
        if 'TITLE' not in content and 'title' in content:
            # Simple replacement: if there is a replacement involving (3) and a variable containing 't' or 'title'
            lines = content.split('\n')
            new_lines = []
            patched = False
            for line in lines:
                new_lines.append(line)
                if 'replaceTextInEntireDocument' in line and ('3' in line or 'Về' in line or 'title' in line):
                    # We inject the TITLE replacement if this line was replacing the title.
                    if 't)' in line or 'title' in line or 'Về việc' in line:
                        # Just to be safe, we add a generic TITLE replacement that uses the same replacement variable.
                        # We extract the variable used as replacement.
                        # doc.replaceTextInEntireDocument(/\(\s*3\s*\)/, t);
                        import re
                        m = re.search(r'replaceTextInEntireDocument\(.*?, (.*?)\)', line)
                        if m:
                            replacement_var = m.group(1).strip()
                            # ensure it's not a hardcoded string
                            if replacement_var and not replacement_var.startswith("'") and not replacement_var.startswith('"'):
                                new_lines.append(f"      doc.replaceTextInEntireDocument(/\\(\\s*TITLE\\s*\\)/i, {replacement_var});")
                                patched = True
                                
            if patched:
                with open(route_file, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(new_lines))
                print(f"Patched {route_file}")
            else:
                print(f"Failed to patch {route_file}")
