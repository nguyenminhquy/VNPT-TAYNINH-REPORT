import re

with open('webapp/app/api/export-04/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Title (3)
search_title = """    // Replace title (3)
    if (title !== undefined) {
      let t = title.trim();
      if (t) {
        if (!/^Về\\s/i.test(t) && !/^V\\/v\\s/i.test(t)) {
          t = 'Về việc ' + t;
        }
      } else {
        t = 'Về việc ............................... (3) .............................';
      }
      doc.replaceTextInEntireDocument(/.*\\(\\s*3\\s*\\).*/, t);
    }"""
replace_title = """    // Replace title (3)
    if (title !== undefined) {
      let t = title.trim();
      if (t) {
        if (/^Về\\s/i.test(t) || /^V\\/v\\s/i.test(t) || /^Về việc\\s/i.test(t)) {
          t = t.replace(/^(Về việc|Về|V\\/v)\\s+/i, '').trim();
        }
        doc.replaceTextInEntireDocument(/\\(\\s*3\\s*\\)/, t);
      }
    }"""
content = content.replace(search_title, replace_title)

# Fix Content (4)
search_content = """    // Replace content (4)
    if (content !== undefined) {
      doc.replaceTextInEntireDocument(/.*\\(\\s*4\\s*\\).*/, content.trim() ? content.replace(/\\n/g, '\\\\n') : '................................................ (4) ...................................................................');
    }"""
replace_content = """    // Replace content (4)
    if (content !== undefined) {
      const contentStr = content.trim().replace(/\\n/g, '\\n');
      if (contentStr) {
        doc.replaceTextInEntireDocument(/\\(\\s*4\\s*\\)/, contentStr);
      }
    }"""
content = content.replace(search_content, replace_content)

with open('webapp/app/api/export-04/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
