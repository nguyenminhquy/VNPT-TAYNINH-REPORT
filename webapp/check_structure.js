const fs = require('fs');
const xml = fs.readFileSync('template_doc.xml', 'utf8');
const { DOMParser } = require('@xmldom/xmldom');
const doc = new DOMParser().parseFromString(xml, 'text/xml');
const body = doc.getElementsByTagName('w:body')[0];
console.log('Body child nodes:');
for (let i = 0; i < body.childNodes.length; i++) {
  const node = body.childNodes[i];
  if (node.nodeType === 1) {
    console.log(node.tagName);
  }
}
