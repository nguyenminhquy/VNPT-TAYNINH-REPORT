import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import { updateMbbFbbMytv, updateMll, updateIspeed, update5s, updateXlsc, updateAppendix, replaceReportWeek } from '@/lib/export-word-service';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const { blobUrls } = await req.json();
    if (!blobUrls) {
      return NextResponse.json({ error: 'Missing blobUrls' }, { status: 400 });
    }

    const sources: Record<string, xlsx.WorkBook> = {};

    // 1. Download all Excels concurrently
    const downloadPromises = Object.entries(blobUrls).map(async ([key, url]) => {
      const resp = await fetch(url as string, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`Failed to download ${key} from ${url}`);
      const arrayBuffer = await resp.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: 'array', cellDates: true });
      sources[key] = workbook;
    });
    await Promise.all(downloadPromises);

    // 2. Load Word Template
    const templatePath = path.join(process.cwd(), 'templates/template.docx');
    const templateBuffer = fs.readFileSync(templatePath);
    
    // 3. Process with DocxModifier
    const doc = new DocxModifier(templateBuffer);
    updateMbbFbbMytv(doc, sources);
    const week = updateMll(doc, sources);
    updateIspeed(doc, sources);
    update5s(doc, sources);
    updateXlsc(doc, sources);
    updateAppendix(doc, sources);
    replaceReportWeek(doc, week);
    doc.flattenLinkFields();

    const resultBuffer = doc.getBuffer();

    // 4. Return the generated Word doc directly to browser
    return new NextResponse(resultBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Bao_cao_VNPT.docx"'
      }
    });

  } catch (error: any) {
    console.error("Export Word JS Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
