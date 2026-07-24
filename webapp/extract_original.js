const fs = require('fs');
const PizZip = require('pizzip');

const buf = fs.readFileSync('templates/ĐN TTHT-KTHT mở mới user tháng 06_2026.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
fs.writeFileSync('template_doc.xml', xml);
console.log('Wrote template_doc.xml, length:', xml.length);
