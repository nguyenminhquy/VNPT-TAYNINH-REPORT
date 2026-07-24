const fs = require('fs');
const PizZip = require('pizzip');

const buf = fs.readFileSync('test_output.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
fs.writeFileSync('test_output.xml', xml);
console.log('Wrote test_output.xml, length:', xml.length);
