import re

with open('webapp/app/api/export-05/route.ts', 'r', encoding='utf-8') as f:
    route_content = f.read()

search = """    // Replace bases (5)
    if (bases !== undefined) {
      let basesArray: string[] = [];
      if (Array.isArray(bases)) {
        basesArray = bases;
      } else if (typeof bases === 'string' && bases.trim()) {
        basesArray = bases.split(/\\r?\\n|\\\\n/);
      }
      if (basesArray.length > 0) {
        doc.replaceParagraphWithMultiple(/.*\\(\\s*5\\s*\\).*/, basesArray);
      } else {
        doc.replaceParagraphWithMultiple(/.*\\(\\s*5\\s*\\).*/, ['Căn cứ ...............................................(5) .......................................................']);
      }
    }

    // Replace article1 (6)
    if (article1 !== undefined) {
      let articlesArray: string[] = [];
      if (Array.isArray(article1)) {
        articlesArray = article1;
      } else if (typeof article1 === 'string' && article1.trim()) {
        articlesArray = article1.split(/\\r?\\n|\\\\n/);
      }
      if (articlesArray.length > 0) {
        doc.replaceParagraphWithMultiple(/.*\\(\\s*6\\s*\\).*/, articlesArray);
      } else {
        doc.replaceParagraphWithMultiple(/.*\\(\\s*6\\s*\\).*/, ['Điều 1. ................................................ (6) ......................................................']);
      }
    }
    
    // Clean up template boilerplate paragraphs for Căn cứ and Điều
    doc.removeParagraphByTextMatch(/^\\.+;?$/);
    doc.removeParagraphByTextMatch(/^Căn cứ\\.+;?$/);
    doc.removeParagraphByTextMatch(/^Điều 2\\.\\s*\\.+$/);
    doc.removeParagraphByTextMatch(/^Điều \\.\\.\\.\\s*\\.+$/);
    doc.removeParagraphByTextMatch(/^\\.+$/);
    doc.removeParagraphByTextMatch(/^\\.+\\/\\.$/);"""

replace = """    // Get bases array
    let basesArray: string[] = [];
    if (bases !== undefined) {
      if (Array.isArray(bases)) {
        basesArray = bases.filter(b => b.trim());
      } else if (typeof bases === 'string' && bases.trim()) {
        basesArray = bases.split(/\\r?\\n|\\\\n/).filter(b => b.trim());
      }
    }

    // Get articles array
    let articlesArray: string[] = [];
    if (article1 !== undefined) {
      if (Array.isArray(article1)) {
        articlesArray = article1.filter(a => a.trim());
      } else if (typeof article1 === 'string' && article1.trim()) {
        articlesArray = article1.split(/\\r?\\n|\\\\n/).filter(a => a.trim());
      }
    }

    // Fill Bases exactly into template placeholders
    // First placeholder: (5)
    if (basesArray.length > 0) {
      doc.replaceTextInEntireDocument(/.*\\(\\s*5\\s*\\).*/, `Căn cứ ${basesArray[0].replace(/^- Căn cứ |- Căn cứ|Căn cứ /i, '').replace(/;$/, '')};`);
    } else {
      doc.replaceTextInEntireDocument(/.*\\(\\s*5\\s*\\).*/, 'Căn cứ ...............................................(5) .......................................................');
    }
    
    // Second placeholder: Căn cứ...............;
    if (basesArray.length > 1) {
      doc.replaceTextInEntireDocument(/^Căn cứ\\.+;?$/, `Căn cứ ${basesArray[1].replace(/^- Căn cứ |- Căn cứ|Căn cứ /i, '').replace(/;$/, '')};`);
    }

    // Fill Articles exactly into template placeholders
    // First placeholder: Điều 1 (6)
    if (articlesArray.length > 0) {
      doc.replaceTextInEntireDocument(/.*\\(\\s*6\\s*\\).*/, `Điều 1. ${articlesArray[0].replace(/^Điều 1\. /i, '')}`);
    } else {
      doc.replaceTextInEntireDocument(/.*\\(\\s*6\\s*\\).*/, 'Điều 1. ................................................ (6) ......................................................');
    }

    // Second placeholder: Điều 2
    if (articlesArray.length > 1) {
      doc.replaceTextInEntireDocument(/^Điều 2\\.\\s*\\.+$/, `Điều 2. ${articlesArray[1].replace(/^Điều 2\. /i, '')}`);
    }

    // Third placeholder: Điều ...
    if (articlesArray.length > 2) {
      doc.replaceTextInEntireDocument(/^Điều \\.\\.\\.\\s*\\.+$/, `Điều 3. ${articlesArray[2].replace(/^Điều 3\. /i, '')}`);
    }"""

route_content = route_content.replace(search, replace)

with open('webapp/app/api/export-05/route.ts', 'w', encoding='utf-8') as f:
    f.write(route_content)

print("Updated route.ts to fill exactly into placeholders")
