const fs = require('fs');
const xml = fs.readFileSync('template_doc.xml', 'utf8');
const { DOMParser } = require('@xmldom/xmldom');
const doc = new DOMParser().parseFromString(xml, 'text/xml');

const tables = Array.from(doc.getElementsByTagName('w:tbl'));
console.log('Total tables:', tables.length);

for (const table of tables.reverse()) {
  if (table.textContent && table.textContent.toLowerCase().includes('họ và tên')) {
    console.log('Found table! Rows:', table.getElementsByTagName('w:tr').length);
    // Print first row text
    console.log('First row text:', table.getElementsByTagName('w:tr')[0].textContent);
    break;
  }
}
