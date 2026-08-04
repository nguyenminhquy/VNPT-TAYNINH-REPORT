import re

with open('webapp/lib/docx-modifier.ts', 'r', encoding='utf-8') as f:
    content = f.read()

search = """  replaceElementText(el: Element, text: string) {
    // Keep paragraph properties
    let pPr = null;
    const pPrNode = el.getElementsByTagName('w:pPr')[0];
    if (pPrNode && pPrNode.parentNode === el) {
      pPr = pPrNode.cloneNode(true);
    }

    // Keep the first run's properties if any
    let rPr = null;
    const runs = el.getElementsByTagName('w:r');
    if (runs.length > 0) {
      const firstRPr = runs[0].getElementsByTagName('w:rPr')[0];
      if (firstRPr) {
        rPr = firstRPr.cloneNode(true);
      }
    }

    // Remove all child nodes
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    const lines = text.split('\\n');
    
    // First line goes into the current paragraph
    if (pPr) {
      el.appendChild(pPr.cloneNode(true));
    }
    const newRun = this.doc.createElement('w:r');
    if (rPr) {
      newRun.appendChild(rPr.cloneNode(true));
    }
    
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        newRun.appendChild(this.doc.createElement('w:br'));
      }
      const newText = this.doc.createElement('w:t');
      newText.appendChild(this.doc.createTextNode(lines[i]));
      newRun.appendChild(newText);
    }
    
    el.appendChild(newRun);
  }"""

replace = """  replaceElementText(el: Element, text: string) {
    const textNodes = Array.from(el.getElementsByTagName('w:t'));
    const lines = text.split('\\n');
    
    if (textNodes.length === 0) {
      // Fallback: create run if no text nodes exist
      const newRun = this.doc.createElement('w:r');
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          newRun.appendChild(this.doc.createElement('w:br'));
        }
        const newText = this.doc.createElement('w:t');
        newText.appendChild(this.doc.createTextNode(lines[i]));
        newRun.appendChild(newText);
      }
      el.appendChild(newRun);
    } else {
      // Preserve existing structure, just overwrite the first text node and clear the rest
      const firstTextNode = textNodes[0];
      const parentRun = firstTextNode.parentNode;
      
      // Clear first text node
      while (firstTextNode.firstChild) {
        firstTextNode.removeChild(firstTextNode.firstChild);
      }
      
      // Set text
      firstTextNode.appendChild(this.doc.createTextNode(lines[0]));
      // Ensure space preservation
      firstTextNode.setAttribute('xml:space', 'preserve');
      
      if (lines.length > 1 && parentRun) {
        let insertRef = firstTextNode.nextSibling;
        for (let i = 1; i < lines.length; i++) {
          const br = this.doc.createElement('w:br');
          const t = this.doc.createElement('w:t');
          t.setAttribute('xml:space', 'preserve');
          t.appendChild(this.doc.createTextNode(lines[i]));
          
          if (insertRef) {
            parentRun.insertBefore(br, insertRef);
            parentRun.insertBefore(t, insertRef);
          } else {
            parentRun.appendChild(br);
            parentRun.appendChild(t);
          }
        }
      }
      
      // Clear all other text nodes
      for (let i = 1; i < textNodes.length; i++) {
        const tNode = textNodes[i];
        while (tNode.firstChild) {
          tNode.removeChild(tNode.firstChild);
        }
      }
    }
  }"""

content = content.replace(search, replace)

with open('webapp/lib/docx-modifier.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated docx-modifier.ts to preserve tabs")
