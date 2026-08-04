import re

with open('webapp/app/api/export-10/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Title (3) replacement
search_title = """    // Replace title (3)
    if (title !== undefined) {
      let t = title.trim();
      if (t) {
        if (/^Về\\s/i.test(t)) {
          t = t.substring(3).trim();
        }
        doc.replaceTextInEntireDocument(/.*\\(\\s*3\\s*\\).*/, /\\(\\s*3\\s*\\)/, t);
      }
    }"""
replace_title = """    // Replace title (3)
    if (title !== undefined) {
      let t = title.trim();
      if (t) {
        if (/^Về\\s/i.test(t)) {
          t = t.substring(3).trim();
        }
        doc.replaceTextInEntireDocument(/\\(\\s*3\\s*\\)/, t);
      }
    }"""
content = content.replace(search_title, replace_title)

# Fix Content (4) replacement
search_content = """    // Replace content (4)
    if (content !== undefined) {
      let contentStr = '';
      if (Array.isArray(content)) {
        contentStr = content.join('\\n');
      } else if (typeof content === 'string') {
        contentStr = content;
      }
      
      contentStr = contentStr.trim().replace(/\\n/g, '\\n');
      if (contentStr) {
        doc.replaceTextInEntireDocument(/.*\\(\\s*4\\s*\\).*/, /\\(\\s*4\\s*\\)/, contentStr);
      }
    }"""
replace_content = """    // Replace content (4)
    if (content !== undefined) {
      let contentStr = '';
      if (Array.isArray(content)) {
        contentStr = content.join('\\n');
      } else if (typeof content === 'string') {
        contentStr = content;
      }
      
      contentStr = contentStr.trim().replace(/\\n/g, '\\n');
      if (contentStr) {
        doc.replaceTextInEntireDocument(/\\(\\s*4\\s*\\)/, contentStr);
      }
    }"""
content = content.replace(search_content, replace_content)

with open('webapp/app/api/export-10/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
