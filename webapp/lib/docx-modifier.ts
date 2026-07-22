import PizZip from 'pizzip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export class DocxModifier {
  private zip: PizZip;
  private doc: any;
  private xmlString: string;

  constructor(buffer: ArrayBuffer | Buffer) {
    this.zip = new PizZip(buffer);
    this.xmlString = this.zip.file('word/document.xml')?.asText() || '';
    if (!this.xmlString) {
      throw new Error('Invalid docx file: missing word/document.xml');
    }
    this.doc = new DOMParser().parseFromString(this.xmlString, 'text/xml');
  }

  // Returns all tables in the document (recursively or top-level. python-docx returns top-level)
  getTables(): Element[] {
    const body = this.doc.getElementsByTagName('w:body')[0];
    if (!body) return [];
    const tables: Element[] = [];
    for (let i = 0; i < body.childNodes.length; i++) {
      const node = body.childNodes[i];
      if (node.nodeType === 1 && (node as Element).tagName === 'w:tbl') {
        tables.push(node as Element);
      }
    }
    return tables;
  }

  // Returns all top-level paragraphs
  getParagraphs(): Element[] {
    const body = this.doc.getElementsByTagName('w:body')[0];
    if (!body) return [];
    const paragraphs: Element[] = [];
    for (let i = 0; i < body.childNodes.length; i++) {
      const node = body.childNodes[i];
      if (node.nodeType === 1 && (node as Element).tagName === 'w:p') {
        paragraphs.push(node as Element);
      }
    }
    return paragraphs;
  }

  replaceParagraph(index: number, text: string) {
    const paragraphs = this.getParagraphs();
    if (index >= paragraphs.length) return;
    const p = paragraphs[index];
    this.replaceElementText(p, text);
  }

  private replaceElementText(el: Element, text: string) {
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

    // Create new w:r
    const newRun = this.doc.createElement('w:r');
    if (rPr) {
      newRun.appendChild(rPr);
    }
    const newText = this.doc.createElement('w:t');
    newText.appendChild(this.doc.createTextNode(text));
    newRun.appendChild(newText);
    el.appendChild(newRun);
  }

  replaceCell(cell: Element, text: string) {
    const paragraphs = cell.getElementsByTagName('w:p');
    if (paragraphs.length === 0) {
      const p = this.doc.createElement('w:p');
      this.replaceElementText(p, text);
      cell.appendChild(p);
    } else {
      this.replaceElementText(paragraphs[0], text);
      // Remove other paragraphs
      for (let i = paragraphs.length - 1; i > 0; i--) {
        cell.removeChild(paragraphs[i]);
      }
    }
  }

  getRows(table: Element): Element[] {
    const rows: Element[] = [];
    for (let i = 0; i < table.childNodes.length; i++) {
      const node = table.childNodes[i];
      if (node.nodeType === 1 && (node as Element).tagName === 'w:tr') {
        rows.push(node as Element);
      }
    }
    return rows;
  }

  getCells(row: Element): Element[] {
    const cells: Element[] = [];
    for (let i = 0; i < row.childNodes.length; i++) {
      const node = row.childNodes[i];
      if (node.nodeType === 1 && (node as Element).tagName === 'w:tc') {
        cells.push(node as Element);
      }
    }
    return cells;
  }

  resizeTableRows(table: Element, desiredRows: number) {
    const rows = this.getRows(table);
    let currentRowCount = rows.length;

    while (currentRowCount < desiredRows) {
      const lastRow = rows[rows.length - 1];
      const cloned = lastRow.cloneNode(true);
      
      // Clear text in cloned row
      const cells = this.getCells(cloned as Element);
      cells.forEach(cell => this.replaceCell(cell, ''));
      
      table.appendChild(cloned);
      currentRowCount++;
    }

    while (currentRowCount > desiredRows) {
      const allRows = this.getRows(table);
      const lastRow = allRows[allRows.length - 1];
      table.removeChild(lastRow);
      currentRowCount--;
    }
  }

  writeTableMatrix(table: Element, matrix: any[][], startRow: number = 0, startCol: number = 0) {
    const rows = this.getRows(table);
    for (let r = 0; r < matrix.length; r++) {
      const targetRowIndex = startRow + r;
      if (targetRowIndex >= rows.length) break;
      const row = rows[targetRowIndex];
      const cells = this.getCells(row);
      
      for (let c = 0; c < matrix[r].length; c++) {
        const targetColIndex = startCol + c;
        if (targetColIndex >= cells.length) break;
        const cell = cells[targetColIndex];
        const value = matrix[r][c];
        
        // Skip touched tracking for simplicity, just replace
        this.replaceCell(cell, String(value ?? ''));
      }
    }
  }

  flattenLinkFields() {
    // 1. Flatten ALL simple link fields <w:fldSimple>
    const fldSimples = Array.from(this.doc.getElementsByTagName('w:fldSimple')) as Element[];
    for (const field of fldSimples) {
      const parent = field.parentNode;
      if (parent) {
        while (field.firstChild) {
          parent.insertBefore(field.firstChild, field);
        }
        parent.removeChild(field);
      }
    }

    // 2. Remove ALL instruction text runs (<w:instrText>)
    const instrTexts = Array.from(this.doc.getElementsByTagName('w:instrText')) as Element[];
    for (const instr of instrTexts) {
      const run = instr.parentNode;
      if (run && run.parentNode) {
        run.parentNode.removeChild(run);
      }
    }
    
    // 3. Remove ALL field character runs (begin, separate, end)
    const fldChars = Array.from(this.doc.getElementsByTagName('w:fldChar')) as Element[];
    for (const fldChar of fldChars) {
       const run = fldChar.parentNode;
       if (run && run.parentNode) {
         run.parentNode.removeChild(run);
       }
    }
  }

  getBuffer(): Buffer {
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(this.doc);
    this.zip.file('word/document.xml', updatedXml);
    return this.zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
  }
}
