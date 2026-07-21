import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.argv[2];
const outputPath = process.argv[3];
const jobs = [
  {
    filename: "1. BÁO CÁO MBB_HUNG.xlsx",
    ranges: {
      "Kết quả chung": "A1:D6",
      "So sánh các tỉnh": "A1:C7",
      "Kết quả chi tiết": "A1:H12",
      "Giải trình QoS": "A1:D10",
      "Giải trình QoE": "A1:D8",
      "Dự kiến tuần 30": "A1:D9",
      "Phản ánh khách hàng (PAKH)": "A1:C10",
    },
  },
  {
    filename: "2. BÁO CÁO FBB_BAO.xlsx",
    ranges: {
      "Thông tin chung": "A1:H17",
      "Suy hao thuê bao": "A1:G25",
      "Chi tiết QoS FBB": "A1:G43",
      "Chi tiết QoE FBB": "A1:E36",
    },
  },
  { filename: "3. BÁO CÁO MYTV_TÂN.xlsx", ranges: { Sheet1: "A1:H16" } },
  {
    filename: "4. BÁO CÁO MLL_KHANH.xlsx",
    ranges: {
      "BC MLL tuần": "A1:W15",
      "Trạm theo NV": "A1:M48",
      "XLSC Đúng hạn": "A1:H37",
      TH: "A1:N21",
    },
  },
  { filename: "5. BÁO CÁO ISPEED_QUOC.xlsx", ranges: { "Báo cáo": "A1:K12" } },
  { filename: "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx", ranges: { Sheet1: "A1:F47" } },
  {
    filename: "7.BÁO CÁO XLSC_TUẤN.xlsx",
    ranges: {
      "XLSC MANE": "A1:O12",
      "XLSC ACCESS": "A1:O12",
      "XLSC VÔ TUYẾN": "A1:M12",
      "PHIẾU QUÁ HẠN": "A1:J12",
    },
  },
  { filename: "PHỤ LỤC 1.xlsx", ranges: { "Báo Cáo Sự Cố Trạm": "A1:J53" } },
];

const output = {};
for (const job of jobs) {
  const input = await FileBlob.load(path.join(root, "data sample", job.filename));
  const workbook = await SpreadsheetFile.importXlsx(input);
  output[job.filename] = {};
  for (const [sheetName, rangeAddress] of Object.entries(job.ranges)) {
    const sheet = workbook.worksheets.getItem(sheetName);
    const range = sheet.getRange(rangeAddress);
    output[job.filename][sheetName] = {
      range: rangeAddress,
      values: range.values,
      formulas: range.formulas,
    };
  }
}

await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
console.log(`Extracted ${Object.keys(output).length} workbooks to ${outputPath}`);
