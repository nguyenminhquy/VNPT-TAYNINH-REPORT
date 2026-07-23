const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

const docStr = fs.readFileSync('templates/template.docx');
const zip = new PizZip(docStr);
const xml = zip.file('word/document.xml').asText();
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const tables = doc.getElementsByTagName('w:tbl');

console.log('Total tables:', tables.length);

// Print the header of each table
for (let i = 14; i <= 21; i++) {
  const tbl = tables[i];
  if (!tbl) continue;
  const trs = tbl.getElementsByTagName('w:tr');
  console.log(`Table ${i} has ${trs.length} rows`);
  if (trs.length > 0) {
    let s = '';
    const ts = trs[0].getElementsByTagName('w:t');
    for (let j = 0; j < ts.length; j++) s += ts[j].textContent;
    console.log(`  Row 0: ${s}`);
  }
}
