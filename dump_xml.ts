import AdmZip from 'adm-zip';

const zip = new AdmZip('test_output.docx');
const docXml = zip.readAsText('word/document.xml');
const lines = docXml.replace(/>/g, '>\n').split('\n');

const index = lines.findIndex(l => l.includes('KT. GIÁM ĐỐC'));
for (let i = Math.max(0, index - 10); i < Math.min(lines.length, index + 20); i++) {
  console.log(`${i}: ${lines[i]}`);
}
