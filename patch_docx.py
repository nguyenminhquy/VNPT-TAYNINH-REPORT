import re

with open('webapp/lib/docx-modifier.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_method = """
  replaceParagraphWithMultiple(searchStr: string | RegExp, texts: string[]): boolean {
    const paragraphs = this.getParagraphs();
    for (const p of paragraphs) {
      const text = p.textContent;
      if (text) {
        let match = false;
        if (typeof searchStr === 'string') {
          match = text.includes(searchStr);
        } else {
          match = searchStr.test(text);
        }
        if (match) {
          if (texts.length === 0) {
            p.parentNode?.removeChild(p);
            return true;
          }
          
          // Replace the first one in-place
          this.replaceElementText(p, texts[0]);
          
          // For the rest, clone the paragraph and insert after
          let currentP = p;
          for (let i = 1; i < texts.length; i++) {
            const clonedP = p.cloneNode(true) as Element;
            this.replaceElementText(clonedP, texts[i]);
            if (currentP.nextSibling) {
              currentP.parentNode?.insertBefore(clonedP, currentP.nextSibling);
            } else {
              currentP.parentNode?.appendChild(clonedP);
            }
            currentP = clonedP;
          }
          return true;
        }
      }
    }
    return false;
  }
"""

content = content.replace("replaceTextInEntireDocument(searchStr: string | RegExp, newText: string): boolean {", new_method + "\n  replaceTextInEntireDocument(searchStr: string | RegExp, newText: string): boolean {")

with open('webapp/lib/docx-modifier.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated docx-modifier.ts")
