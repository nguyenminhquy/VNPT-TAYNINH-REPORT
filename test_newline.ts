import fs from 'fs';
import { DocxModifier } from './webapp/lib/docx-modifier';

const docBuffer = fs.readFileSync('./webapp/templates/TOTRINH/01_Mau_Bao_cao.docx');
const doc = new DocxModifier(docBuffer);

doc.replaceTextInEntireDocument(/^GIÁM ĐỐC\s*$/, "KT. GIÁM ĐỐC\\nPHÓ GIÁM ĐỐC");

fs.writeFileSync('test_output.docx', doc.getBuffer());
