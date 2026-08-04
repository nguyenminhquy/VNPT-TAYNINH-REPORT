import re

with open('webapp/app/api/export-05/route.ts', 'r', encoding='utf-8') as f:
    route_content = f.read()

# Fix bases array parsing
bases_search = """      const basesArray = Array.isArray(bases) ? bases : (bases ? [bases] : []);"""
bases_replace = """      let basesArray: string[] = [];
      if (Array.isArray(bases)) {
        basesArray = bases;
      } else if (typeof bases === 'string' && bases.trim()) {
        basesArray = bases.split(/\\r?\\n|\\\\n/);
      }"""
route_content = route_content.replace(bases_search, bases_replace)

# Fix articles array parsing
articles_search = """      const articlesArray = Array.isArray(article1) ? article1 : (article1 ? [article1] : []);"""
articles_replace = """      let articlesArray: string[] = [];
      if (Array.isArray(article1)) {
        articlesArray = article1;
      } else if (typeof article1 === 'string' && article1.trim()) {
        articlesArray = article1.split(/\\r?\\n|\\\\n/);
      }"""
route_content = route_content.replace(articles_search, articles_replace)

with open('webapp/app/api/export-05/route.ts', 'w', encoding='utf-8') as f:
    f.write(route_content)

print("Fixed route.ts to handle strings with newlines as arrays")
