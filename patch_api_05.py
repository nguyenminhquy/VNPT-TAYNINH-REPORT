import re

# 1. Update export-05/route.ts
with open('webapp/app/api/export-05/route.ts', 'r', encoding='utf-8') as f:
    route_content = f.read()

route_search = """    // Replace bases (5)
    if (bases !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*5\s*\).*/, bases.trim() ? bases.replace(/\\n/g, '\\\\n') : 'Căn cứ ...............................................(5) .......................................................');
    }

    // Replace article1 (6)
    if (article1 !== undefined) {
      doc.replaceTextInEntireDocument(/.*\(\s*6\s*\).*/, article1.trim() ? article1.replace(/\\n/g, '\\\\n') : 'Điều 1. ................................................ (6) ......................................................');
    }"""

route_replace = """    // Replace bases (5)
    if (bases !== undefined) {
      const basesArray = Array.isArray(bases) ? bases : (bases ? [bases] : []);
      if (basesArray.length > 0) {
        doc.replaceParagraphWithMultiple(/.*\\(\\s*5\\s*\\).*/, basesArray);
      } else {
        doc.replaceParagraphWithMultiple(/.*\\(\\s*5\\s*\\).*/, ['Căn cứ ...............................................(5) .......................................................']);
      }
    }

    // Replace article1 (6)
    if (article1 !== undefined) {
      const articlesArray = Array.isArray(article1) ? article1 : (article1 ? [article1] : []);
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
    doc.removeParagraphByTextMatch(/^\\.+\\/\\.$/);
"""
route_content = route_content.replace(route_search, route_replace)

with open('webapp/app/api/export-05/route.ts', 'w', encoding='utf-8') as f:
    f.write(route_content)

# 2. Update page.tsx to send array instead of string joined with \n
with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()

page_search = """      const formattedBases = form5.bases.filter(b => b.trim()).map((b, i) => form5.bases.length === 1 ? `Căn cứ ${b}` : `- Căn cứ ${b}`).join('\\\\n');
      const formattedArticles = form5.articles.filter(a => a.trim()).map((a, i) => `Điều ${i + 1}. ${a}`).join('\\\\n');"""

page_replace = """      const formattedBases = form5.bases.filter(b => b.trim()).map((b, i) => form5.bases.length === 1 ? `Căn cứ ${b};` : `- Căn cứ ${b};`);
      const formattedArticles = form5.articles.filter(a => a.trim()).map((a, i) => `Điều ${i + 1}. ${a}`);"""
      
page_content = page_content.replace(page_search, page_replace)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_content)

print("Updated route.ts and page.tsx")
