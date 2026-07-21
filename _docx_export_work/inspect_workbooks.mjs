import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.argv[2];
const outputPath = process.argv[3];
const files = [
  "1. BÁO CÁO MBB_HUNG.xlsx",
  "2. BÁO CÁO FBB_BAO.xlsx",
  "3. BÁO CÁO MYTV_TÂN.xlsx",
  "4. BÁO CÁO MLL_KHANH.xlsx",
  "5. BÁO CÁO ISPEED_QUOC.xlsx",
  "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx",
  "7.BÁO CÁO XLSC_TUẤN.xlsx",
  "PHỤ LỤC 1.xlsx",
];

const result = [];
for (const filename of files) {
  const filePath = path.join(root, "data sample", filename);
  const input = await FileBlob.load(filePath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheetInspection = await workbook.inspect({
    kind: "sheet",
    include: "id,name",
    maxChars: 12000,
  });
  result.push({ filename, sheets: sheetInspection.ndjson });
}

await fs.writeFile(outputPath, JSON.stringify(result, null, 2), "utf8");
console.log(JSON.stringify(result, null, 2));
