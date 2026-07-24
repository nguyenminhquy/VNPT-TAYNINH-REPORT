const { DOMParser } = require('@xmldom/xmldom');

const xml = `
<w:tc xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:t>P1</w:t></w:p>
  <w:p><w:t>P2</w:t></w:p>
  <w:sdt>
    <w:sdtContent>
      <w:p><w:t>P3</w:t></w:p>
    </w:sdtContent>
  </w:sdt>
</w:tc>
`;

const doc = new DOMParser().parseFromString(xml, 'text/xml');
const cell = doc.documentElement;
const paragraphs = cell.getElementsByTagName('w:p');

console.log("Found paragraphs:", paragraphs.length);

for (let i = paragraphs.length - 1; i > 0; i--) {
  try {
    cell.removeChild(paragraphs[i]);
    console.log("Removed P" + i);
  } catch (e) {
    console.error("Error removing P" + i + ": " + e.message);
  }
}
