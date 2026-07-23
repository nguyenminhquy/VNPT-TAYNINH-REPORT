import { DocxModifier } from './docx-modifier';
import { asNumber, percent, integer, decimal, evaluateTarget, clean, rawMatrix, worksheetMatrix } from './excel-extractor';
import * as xlsx from 'xlsx';

export function updateMbbFbbMytv(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>) {
  const mbb = sources['mbb'];
  const fbb = sources['fbb'];
  const mytv = sources['mytv'];
  const tables = doc.getTables();

  const common = worksheetMatrix(mbb.Sheets['Kết quả chung'], 4, 6, 1, 4);
  for (let i = 1; i < common.length; i++) {
    common[i][2] = decimal(common[i][2]);
    common[i][3] = decimal(common[i][3]);
  }
  doc.writeTableMatrix(tables[1], common);

  const comparison = worksheetMatrix(mbb.Sheets['So sánh các tỉnh'], 3, 7, 1, 3);
  doc.writeTableMatrix(tables[2], comparison);

  const mbbDetail = worksheetMatrix(mbb.Sheets['Kết quả chi tiết'], 4, 12, 1, 8);
  doc.writeTableMatrix(tables[3], mbbDetail, 3);

  const fbbDetail = worksheetMatrix(fbb.Sheets['Thông tin chung'], 2, 17, 1, 8);
  doc.writeTableMatrix(tables[3], fbbDetail, 13);

  const mytvRows = rawMatrix(mytv.Sheets['Sheet1'], 3, 16, 1, 8);
  const mytvDetail: string[][] = [];
  for (const row of mytvRows) {
    const total = row[6];
    mytvDetail.push([
      clean(row[0]), clean(row[1]), clean(row[3]), clean(row[4]), clean(row[5]),
      clean(total), evaluateTarget(total), clean(row[7])
    ]);
  }
  doc.writeTableMatrix(tables[3], mytvDetail, 30);

  const qosExplanation = worksheetMatrix(mbb.Sheets['Giải trình QoS'], 4, 10, 1, 4);
  const qoeExplanation = worksheetMatrix(mbb.Sheets['Giải trình QoE'], 4, 8, 1, 4);
  
  const planSheetName = Object.keys(mbb.Sheets).find(name => name.startsWith('Dự kiến tuần')) || '';
  const plan = planSheetName ? worksheetMatrix(mbb.Sheets[planSheetName], 3, 9, 1, 4) : [];
  const feedback = worksheetMatrix(mbb.Sheets['Phản ánh khách hàng (PAKH)'], 4, 10, 1, 3);

  doc.writeTableMatrix(tables[4], qosExplanation);
  doc.writeTableMatrix(tables[5], qoeExplanation);
  if (plan.length) doc.writeTableMatrix(tables[6], plan);
  doc.writeTableMatrix(tables[7], feedback);

  const qosSheet = fbb.Sheets['Chi tiết QoS FBB'];
  doc.writeTableMatrix(tables[8], worksheetMatrix(qosSheet, 1, 2, 1, 2));
  doc.writeTableMatrix(tables[9], worksheetMatrix(qosSheet, 5, 6, 1, 7));
  doc.writeTableMatrix(tables[10], worksheetMatrix(qosSheet, 9, 17, 1, 4));
  doc.writeTableMatrix(tables[11], worksheetMatrix(qosSheet, 20, 43, 1, 5));
  doc.writeTableMatrix(tables[12], worksheetMatrix(fbb.Sheets['Suy hao thuê bao'], 2, 25, 1, 7));

  const planWeekMatch = planSheetName.match(/(\d+)$/);
  if (planWeekMatch) {
    doc.replaceParagraph(18, `Công việc dự kiến tuần ${planWeekMatch[1]}:`);
  }

  const feedbackCutoffRow = feedback.slice(1).find(row => clean(row[1]).toLowerCase().includes('đến'));
  const feedbackCutoff = feedbackCutoffRow ? clean(feedbackCutoffRow[1]) : '';
  const cutoffMatch = feedbackCutoff.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (cutoffMatch) {
    const parts = cutoffMatch[1].split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    doc.replaceParagraph(20, `Thời gian lấy báo cáo: 01/${m}/${y} – ${d}/${m}/${y}`);
  }
}

function mllTableMatrix(sheet: xlsx.WorkSheet): { matrix: string[][], metrics: any } {
  const raw = rawMatrix(sheet, 2, 12, 1, 18);
  const title = clean(raw[0][0]);
  const matrix: string[][] = [[title]];

  const sourceColumns = [0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17];
  for (const row of raw.slice(3, 11)) {
    const target: string[] = [];
    sourceColumns.forEach((sourceIndex, targetIndex) => {
      const value = row[sourceIndex];
      if (targetIndex === 0 || targetIndex === 1) target.push(clean(value));
      else if (targetIndex === 2) target.push(integer(value));
      else if (targetIndex >= 3 && targetIndex <= 11) target.push(integer(value, true));
      else if (targetIndex === 12 || targetIndex === 13) target.push(integer(value));
      else target.push(decimal(value));
    });
    matrix.push(target);
  }

  const overall = raw[3];
  const teams = raw.slice(4, 11);
  const weekMatch = title.match(/TUẦN\s+(\d+)/i);
  
  const metrics = {
    title,
    week: weekMatch ? weekMatch[1] : '',
    total: asNumber(overall[15]),
    average: asNumber(overall[17]),
    teams: teams.map(row => ({ name: clean(row[1]), average: asNumber(row[17]) })),
    causePower: asNumber(overall[3]) + asNumber(overall[7]) + asNumber(overall[11]),
    causeEquipment: asNumber(overall[4]) + asNumber(overall[8]) + asNumber(overall[12]),
    causeTransmission: asNumber(overall[5]) + asNumber(overall[9]) + asNumber(overall[13]),
  };
  return { matrix, metrics };
}

export function updateMll(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>): string {
  const sheet = sources['mll'].Sheets['BC MLL tuần'];
  const { matrix, metrics } = mllTableMatrix(sheet);
  const tables = doc.getTables();
  
  const titleCell = doc.getCells(doc.getRows(tables[13])[0])[0];
  doc.replaceCell(titleCell, matrix[0][0]);
  doc.writeTableMatrix(tables[13], matrix.slice(1), 3);

  const week = metrics.week;
  doc.replaceParagraph(36, `Tổng thời gian mất liên lạc: ${integer(metrics.total)} phút.`);
  doc.replaceParagraph(37, `MLL trung bình/1 BTS: ${metrics.average.toFixed(2)} phút.`);

  if (week) {
    doc.replaceParagraph(41, `Đánh giá thời gian mất liên lạc vô tuyến tuần ${week}:`);
    doc.replaceParagraph(50, `Nguyên nhân chi tiết các trạm MLL trong tuần ${week} năm 2026 và các đánh giá, giải pháp khắc phục (Theo phụ lục 01 đính kèm)`);
    doc.replaceParagraph(121, `GIẢI TRÌNH NGUYÊN NHÂN MẤT LIÊN LẠC TRẠM TUẦN ${week}`);
  }

  const achieved = metrics.teams.filter((t: any) => t.average <= 3.0).length;
  doc.replaceParagraph(42, `${achieved}/7 THT có thời gian mất liên lạc đáp ứng chỉ tiêu của VTT (≤3 phút).`);
  
  const highest = [...metrics.teams].sort((a, b) => b.average - a.average).slice(0, 3);
  const highestText = highest.map(t => `THT ${t.name} (${t.average.toFixed(2)} phút/1 trạm)`).join(', ');
  doc.replaceParagraph(43, `Thời gian mất liên lạc trung bình trên 1 trạm BTS cao nhất: ${highestText}.`);

  const total = metrics.total || 1.0;
  doc.replaceParagraph(45, `MLL do lỗi nguồn (${Math.round(metrics.causePower / total * 100)}%)`);
  doc.replaceParagraph(46, `MLL do lỗi thiết bị (${Math.round(metrics.causeEquipment / total * 100)}%)`);
  doc.replaceParagraph(47, `MLL do lỗi truyền dẫn (${Math.round(metrics.causeTransmission / total * 100)}%)`);
  
  return week;
}

export function updateIspeed(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>) {
  const sheet = sources['ispeed'].Sheets['Báo cáo'];
  const raw = rawMatrix(sheet, 1, 9, 1, 11);
  const matrix: string[][] = [];
  
  for (let r = 0; r < raw.length; r++) {
    const row = raw[r];
    if (r === 0) {
      matrix.push(row.map(v => clean(v)));
      continue;
    }
    matrix.push([
      clean(row[0]), clean(row[1]), integer(row[2]), integer(row[3]), integer(row[4]),
      percent(row[5]), integer(row[6]), integer(row[7]), percent(row[8]), integer(row[9]), percent(row[10])
    ]);
  }
  const tables = doc.getTables();
  doc.writeTableMatrix(tables[14], matrix);

  const reportDateCell = sheet[xlsx.utils.encode_cell({r: 11, c: 1})];
  const reportDate = clean(reportDateCell ? reportDateCell.v : '');
  if (reportDate) {
    doc.replaceParagraph(55, `Thời gian lấy báo cáo: ${reportDate}`);
  }

  const total = raw[raw.length - 1];
  doc.replaceParagraph(59, `Công tác đo kiểm i-Speed đã thực hiện ${integer(total[4])}/${integer(total[3])} mẫu, đạt ${percent(total[5])}/Tháng kế hoạch.`);
  doc.replaceParagraph(60, `Công tác đo kiểm SpeedTest đã thực hiện ${integer(total[7])}/${integer(total[6])} mẫu, đạt ${percent(total[8])}/Tháng kế hoạch.`);
  doc.replaceParagraph(61, `Kết quả mẫu đo 5G SpeedTest đã thực hiện ${integer(total[9])}/${integer(total[7])} mẫu, đạt ${percent(total[10])}/Tổng mẫu đã đo.`);
}

function format5sMatrix(rows: any[][]): string[][] {
  const result: string[][] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (r <= 1) {
      result.push(row.map(v => clean(v)));
      continue;
    }
    result.push([
      clean(row[0]), clean(row[1]), integer(row[2]), integer(row[3]), integer(row[4]), percent(row[5])
    ]);
  }
  return result;
}

export function update5s(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>) {
  const sheet = sources['5s'].Sheets['Sheet1'];
  const station = format5sMatrix(rawMatrix(sheet, 1, 10, 1, 6));
  const airConditioning = format5sMatrix(rawMatrix(sheet, 14, 23, 1, 6));
  const apOtb = format5sMatrix(rawMatrix(sheet, 26, 35, 1, 6));
  
  const tables = doc.getTables();
  doc.writeTableMatrix(tables[15], station);
  doc.writeTableMatrix(tables[16], apOtb);
  doc.writeTableMatrix(tables[17], airConditioning);

  // We don't have file modification time from Blob URL easily, so we just use current date
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const value = `Thời gian lấy báo cáo: ${d}/${m}/${y}`;
  doc.replaceParagraph(64, value);
  doc.replaceParagraph(70, value);
  doc.replaceParagraph(76, value);
}

function parseXlscTitle(title: string) {
  const match = title.match(/\((\d{2})-(\d{2})-(\d{4})\s*-\s*(\d{2})-(\d{2})-(\d{4})\)/);
  if (!match) return null;
  return {
    start: `${match[1]}/${match[2]}/${match[3]}`,
    end: `${match[4]}/${match[5]}/${match[6]}`,
    month: parseInt(match[5]),
    year: parseInt(match[6])
  };
}

function xlscMatrix(sheet: xlsx.WorkSheet): string[][] {
  const raw = rawMatrix(sheet, 1, 10, 1, 10);
  const result: string[][] = [];
  for (let r = 0; r < raw.length; r++) {
    const row = raw[r];
    if (r <= 1) {
      result.push(row.map(v => clean(v)));
      continue;
    }
    result.push([
      clean(row[0]), integer(row[1]), integer(row[2]), integer(row[3]), integer(row[4]),
      percent(row[5], 2, true), integer(row[6]), integer(row[7]), integer(row[8]), percent(row[9], 2, true)
    ]);
  }
  return result;
}

export function updateXlsc(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>) {
  const workbook = sources['xlsc'];
  const mappings = [
    { sheetName: 'XLSC MANE', tableIndex: 18, paragraphStart: 81 },
    { sheetName: 'XLSC ACCESS', tableIndex: 19, paragraphStart: 94 },
    { sheetName: 'XLSC VÔ TUYẾN', tableIndex: 20, paragraphStart: 105 },
  ];
  const tables = doc.getTables();
  let reportMonth: any = null;

  for (const m of mappings) {
    const sheet = workbook.Sheets[m.sheetName];
    if (!sheet) continue;
    const matrix = xlscMatrix(sheet);
    doc.writeTableMatrix(tables[m.tableIndex], matrix);
    
    const titleCell = sheet[xlsx.utils.encode_cell({r: 0, c: 0})];
    const dateRange = parseXlscTitle(clean(titleCell ? titleCell.v : ''));
    if (dateRange) reportMonth = dateRange;

    const totalRow = rawMatrix(sheet, 10, 10, 1, 10)[0];
    if (dateRange) {
      doc.replaceParagraph(m.paragraphStart, `Kỳ báo cáo: ${dateRange.start} – ${dateRange.end}`);
    }
    doc.replaceParagraph(m.paragraphStart + 1, `Tổng phiếu giao: ${integer(totalRow[1])} phiếu`);
    doc.replaceParagraph(m.paragraphStart + 2, `Hoàn thành: ${integer(totalRow[2])}/${integer(totalRow[1])} phiếu`);
    doc.replaceParagraph(m.paragraphStart + 3, `Hoàn thành đúng hạn: ${integer(totalRow[3])} phiếu`);
    doc.replaceParagraph(m.paragraphStart + 4, `Hoàn thành quá hạn: ${integer(totalRow[4])} phiếu`);
    doc.replaceParagraph(m.paragraphStart + 5, `Tỉ lệ đúng hạn: ${percent(totalRow[5], 2, true)}`);
    doc.replaceParagraph(m.paragraphStart + 6, `Phiếu tồn quá hạn: ${integer(totalRow[8])} phiếu`);
  }

  if (reportMonth) {
    doc.replaceParagraph(79, `KẾT QUẢ THỰC HIỆN PHIẾU SỰ CỐ CHUYÊN ĐỀ 5 THÁNG ${reportMonth.month} NĂM ${reportMonth.year}:`);
  }
}

export function updateAppendix(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>) {
  const sheet = sources['appendix'].Sheets['Báo Cáo Sự Cố Trạm'];
  const ref = sheet['!ref'] || "A1:A5";
  const range = xlsx.utils.decode_range(ref);
  const maxRow = range.e.r + 1;

  const dataRows: number[] = [];
  for (let r = 5; r <= maxRow; r++) {
    const cell = sheet[xlsx.utils.encode_cell({r: r - 1, c: 0})];
    const val = clean(cell ? cell.v : '');
    if (val.match(/^\d+$/)) dataRows.push(r);
  }
  const lastRow = dataRows.length > 0 ? Math.max(...dataRows) : 4;
  const matrix = worksheetMatrix(sheet, 4, lastRow, 1, 10);
  
  const tables = doc.getTables();
  const table = tables[22];
  doc.resizeTableRows(table, matrix.length);
  doc.writeTableMatrix(table, matrix);
}

export function replaceReportWeek(doc: DocxModifier, _ignoredWeek: string) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const currentWeek = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const currentYear = d.getUTCFullYear();
  const weekStr = String(currentWeek);

  const planPara = doc.getParagraphs()[18];
  const text = planPara ? planPara.textContent || '' : '';
  const planMatch = text.match(/tuần\s+(\d+)/i);
  const planWeek = planMatch ? planMatch[1] : String(currentWeek + 1);

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // The header date is in the first table (index 0), paragraph 6
  doc.replaceTableParagraph(0, 6, `Tây Ninh, ngày ${day} tháng ${month} năm ${currentYear}`);

  doc.replaceParagraph(1, `V/v thực hiện công việc trọng tâm trong tuần ${weekStr} năm ${currentYear}`);
  doc.replaceParagraph(2, `và kế hoạch thực hiện nhiệm vụ tuần ${planWeek}`);
  doc.replaceParagraph(4, `Trung tâm Hạ tầng báo cáo kết quả thực hiện công việc trọng tâm trong tuần ${weekStr} năm ${currentYear} như sau:`);
  doc.replaceParagraph(116, `Trên đây là báo cáo kết quả thực hiện công việc tuần ${weekStr} năm ${currentYear}.`);
}
