import { DocxModifier } from './docx-modifier';
import { asNumber, percent, integer, decimal, evaluateTarget, clean, rawMatrix, worksheetMatrix } from './excel-extractor';
import * as xlsx from 'xlsx';

export function updateMbbFbbMytv(doc: DocxModifier, sources: Record<string, xlsx.WorkBook>) {
  const mbb = sources['mbb'];
  const fbb = sources['fbb'];
  const mytv = sources['mytv'];

  const common = worksheetMatrix(mbb.Sheets['Kết quả chung'], 4, 6, 1, 4);
  for (let i = 1; i < common.length; i++) {
    common[i][2] = decimal(common[i][2]);
    common[i][3] = decimal(common[i][3]);
  }
  const table1 = doc.findTableByInternalText('STTĐơn vịQoSQoE') || doc.findTableByInternalText('STT');
  if (table1) doc.writeTableMatrix(table1, common);

  const comparison = worksheetMatrix(mbb.Sheets['So sánh các tỉnh'], 3, 7, 1, 3);
  const table2 = doc.findTableByInternalText('TỉnhQoS MBBQoE MBB');
  if (table2) doc.writeTableMatrix(table2, comparison);

  const mbbDetail = worksheetMatrix(mbb.Sheets['Kết quả chi tiết'], 4, 12, 1, 8);
  const table3 = doc.findTableByInternalText('Thành phầnĐiểm thành phầnTổng');
  if (table3) {
    doc.writeTableMatrix(table3, mbbDetail, 3);
    
    const fbbDetail = worksheetMatrix(fbb.Sheets['Thông tin chung'], 2, 17, 1, 8);
    doc.writeTableMatrix(table3, fbbDetail, 13);
    
    const mytvRows = rawMatrix(mytv.Sheets['Sheet1'], 2, 15, 1, 8);
    const mytvDetail: string[][] = [];
    for (const row of mytvRows) {
      const total = row[6];
      mytvDetail.push([
        clean(row[0]), clean(row[1]), clean(row[3]), clean(row[4]), clean(row[5]),
        clean(total), evaluateTarget(total), clean(row[7])
      ]);
    }
    doc.writeTableMatrix(table3, mytvDetail, 30);
  }

  const qosExplanation = worksheetMatrix(mbb.Sheets['Giải trình QoS'], 4, 10, 1, 4);
  const qoeExplanation = worksheetMatrix(mbb.Sheets['Giải trình QoE'], 4, 8, 1, 4);
  
  const planSheetName = Object.keys(mbb.Sheets).find(name => name.startsWith('Dự kiến tuần')) || '';
  const plan = planSheetName ? worksheetMatrix(mbb.Sheets[planSheetName], 3, 9, 1, 4) : [];
  const feedback = worksheetMatrix(mbb.Sheets['Phản ánh khách hàng (PAKH)'], 4, 10, 1, 3);

  const table4 = doc.findTableByPrecedingText('Chỉ số QoS MBB');
  if (table4) doc.writeTableMatrix(table4, qosExplanation);
  const table5 = doc.findTableByPrecedingText('Chỉ số QoE MBB');
  if (table5) doc.writeTableMatrix(table5, qoeExplanation);
  const table6 = doc.findTableByPrecedingText('Công việc dự kiến tuần');
  if (table6 && plan.length) doc.writeTableMatrix(table6, plan);
  const table7 = doc.findTableByPrecedingText('Kết quả thực hiện:');
  if (table7) doc.writeTableMatrix(table7, feedback);

  const qosSheet = fbb.Sheets['Chi tiết QoS FBB'];
  const table8Real = doc.findTableByInternalText('Nguyên nhânGiải pháp');
  if (table8Real) doc.writeTableMatrix(table8Real, worksheetMatrix(qosSheet, 1, 2, 1, 2));

  const table9 = doc.findTableByInternalText('NgàyOLTSố lượng Uplink');
  if (table9) doc.writeTableMatrix(table9, worksheetMatrix(qosSheet, 5, 6, 1, 7));

  const table10 = doc.findTableByInternalText('STTTHTFBB QoSĐạt/Chưa đạt');
  if (table10) doc.writeTableMatrix(table10, worksheetMatrix(qosSheet, 9, 17, 1, 4));

  const table11 = doc.findTableByInternalText('STTTHTTTVTFBB QoSĐạt/Chưa đạt');
  if (table11) doc.writeTableMatrix(table11, worksheetMatrix(qosSheet, 20, 43, 1, 5));

  const table12 = doc.findTableByInternalText('Thuê bao suy haoTỉ lệ suy hao');
  if (table12) doc.writeTableMatrix(table12, worksheetMatrix(fbb.Sheets['Suy hao thuê bao'], 2, 25, 1, 7));

  const planWeekMatch = planSheetName.match(/(\d+)$/);
  if (planWeekMatch) {
    doc.replaceParagraphByTextMatch(/Công việc dự kiến tuần \d+:/, `Công việc dự kiến tuần ${planWeekMatch[1]}:`);
  }

  const feedbackCutoffRow = feedback.slice(1).find(row => clean(row[1]).toLowerCase().includes('đến'));
  const feedbackCutoff = feedbackCutoffRow ? clean(feedbackCutoffRow[1]) : '';
  const cutoffMatch = feedbackCutoff.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (cutoffMatch) {
    const parts = cutoffMatch[1].split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    // Find the first "Thời gian lấy báo cáo:" that happens before table 3? 
    // We will just do a general regex replacement, but only replace the first occurrence that matches exactly.
    // Actually, "Thời gian lấy báo cáo: từ" is more specific.
    doc.replaceParagraphByTextMatch(/Thời gian lấy báo cáo: từ \d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}/, `Thời gian lấy báo cáo: từ 01/${m}/${y} – ${d}/${m}/${y}`);
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
  const tableMll = doc.findTableByInternalText('THỜI GIAN MẤT LIÊN LẠC MẠNG DI ĐỘNG');
  if (tableMll) {
    const titleCell = doc.getCells(doc.getRows(tableMll)[0])[0];
    doc.replaceCell(titleCell, matrix[0][0]);
    doc.writeTableMatrix(tableMll, matrix.slice(1), 3);
  }

  const week = metrics.week;
  doc.replaceParagraphByTextMatch(/Tổng thời gian mất liên lạc:/, `Tổng thời gian mất liên lạc: ${integer(metrics.total)} phút.`);
  doc.replaceParagraphByTextMatch(/MLL trung bình\/1 BTS:/, `MLL trung bình/1 BTS: ${metrics.average.toFixed(2)} phút.`);

  if (week) {
    doc.replaceParagraphByTextMatch(/Đánh giá thời gian mất liên lạc vô tuyến tuần \d+:/, `Đánh giá thời gian mất liên lạc vô tuyến tuần ${week}:`);
    doc.replaceParagraphByTextMatch(/Nguyên nhân chi tiết các trạm MLL trong tuần \d+ năm \d+/, `Nguyên nhân chi tiết các trạm MLL trong tuần ${week} năm 2026 và các đánh giá, giải pháp khắc phục (Theo phụ lục 01 đính kèm)`);
    doc.replaceParagraphByTextMatch(/GIẢI TRÌNH NGUYÊN NHÂN MẤT LIÊN LẠC TRẠM TUẦN \d+/, `GIẢI TRÌNH NGUYÊN NHÂN MẤT LIÊN LẠC TRẠM TUẦN ${week}`);
  }

  const achieved = metrics.teams.filter((t: any) => t.average <= 3.0).length;
  doc.replaceParagraphByTextMatch(/THT có thời gian mất liên lạc đáp ứng chỉ tiêu của VTT/, `${achieved}/7 THT có thời gian mất liên lạc đáp ứng chỉ tiêu của VTT (≤3 phút).`);
  
  const highest = [...metrics.teams].sort((a, b) => b.average - a.average).slice(0, 3);
  const highestText = highest.map(t => `THT ${t.name} (${t.average.toFixed(2)} phút/1 trạm)`).join(', ');
  doc.replaceParagraphByTextMatch(/Thời gian mất liên lạc trung bình trên 1 trạm BTS cao nhất:/, `Thời gian mất liên lạc trung bình trên 1 trạm BTS cao nhất: ${highestText}.`);

  const total = metrics.total || 1.0;
  doc.replaceParagraphByTextMatch(/MLL do lỗi nguồn/, `MLL do lỗi nguồn (${Math.round(metrics.causePower / total * 100)}%)`);
  doc.replaceParagraphByTextMatch(/MLL do lỗi thiết bị/, `MLL do lỗi thiết bị (${Math.round(metrics.causeEquipment / total * 100)}%)`);
  doc.replaceParagraphByTextMatch(/MLL do lỗi truyền dẫn/, `MLL do lỗi truyền dẫn (${Math.round(metrics.causeTransmission / total * 100)}%)`);
  
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
  const tableIspeed = doc.findTableByInternalText('Tỉ lệ hoàn thành i-Speed');
  if (tableIspeed) doc.writeTableMatrix(tableIspeed, matrix);

  const reportDateCell = sheet[xlsx.utils.encode_cell({r: 11, c: 1})];
  const reportDate = clean(reportDateCell ? reportDateCell.v : '');
  if (reportDate) {
    // Only replace if it matches the specific pattern before i-Speed. 
    // In the template, it is just "Thời gian lấy báo cáo:"
    // We can just use the global match, but it might replace the first one. 
    // Wait! Let's match the date format.
    doc.replaceParagraphByTextMatch(/Thời gian lấy báo cáo: \d{2}\/\d{2}\/\d{4}$/, `Thời gian lấy báo cáo: ${reportDate}`);
  }

  const total = raw[raw.length - 1];
  doc.replaceParagraphByTextMatch(/Công tác đo kiểm i-Speed đã thực hiện/, `Công tác đo kiểm i-Speed đã thực hiện ${integer(total[4])}/${integer(total[3])} mẫu, đạt ${percent(total[5])}/Tháng kế hoạch.`);
  doc.replaceParagraphByTextMatch(/Công tác đo kiểm SpeedTest đã thực hiện/, `Công tác đo kiểm SpeedTest đã thực hiện ${integer(total[7])}/${integer(total[6])} mẫu, đạt ${percent(total[8])}/Tháng kế hoạch.`);
  doc.replaceParagraphByTextMatch(/Kết quả mẫu đo 5G SpeedTest đã thực hiện/, `Kết quả mẫu đo 5G SpeedTest đã thực hiện ${integer(total[9])}/${integer(total[7])} mẫu, đạt ${percent(total[10])}/Tổng mẫu đã đo.`);
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

  function findTableStart(sheet: xlsx.WorkSheet, keyword: string): number {
    for (let r = 0; r < 200; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = sheet[xlsx.utils.encode_cell({r, c})];
        if (cell && cell.v && String(cell.v).toUpperCase().includes(keyword.toUpperCase())) {
          return r + 1; // Return 1-indexed start row for rawMatrix
        }
      }
    }
    return -1; // Not found
  }

  const stationStart = findTableStart(sheet, '5S NHÀ TRẠM');
  const station = stationStart > 0 ? format5sMatrix(rawMatrix(sheet, stationStart, stationStart + 9, 1, 6)) : [];

  const airStart = findTableStart(sheet, 'VỆ SINH MÁY LẠNH');
  const airConditioning = airStart > 0 ? format5sMatrix(rawMatrix(sheet, airStart, airStart + 9, 1, 6)) : [];

  const apOtbStart = findTableStart(sheet, '5S AP/OTB');
  const apOtb = apOtbStart > 0 ? format5sMatrix(rawMatrix(sheet, apOtbStart, apOtbStart + 9, 1, 6)) : [];

  const surveyStart = findTableStart(sheet, 'KHẢO SÁT PHỤ TRỢ');
  const survey = surveyStart > 0 ? format5sMatrix(rawMatrix(sheet, surveyStart, surveyStart + 9, 1, 6)) : [];
  
  const tblStation = doc.findTableByPrecedingText('Tiến độ 5S nhà trạm');
  if (tblStation) doc.writeTableMatrix(tblStation, station);

  const tblApOtb = doc.findTableByPrecedingText('Tiến độ 5S AP/OTB');
  if (tblApOtb) doc.writeTableMatrix(tblApOtb, apOtb);

  const tblAir = doc.findTableByPrecedingText('Tiến độ vệ sinh máy lạnh');
  if (tblAir) doc.writeTableMatrix(tblAir, airConditioning);

  // Check if the 4th table (Khảo sát phụ trợ) exists. If not, clone the 3rd table (Vệ sinh máy lạnh)
  let tblSurvey = doc.findTableByPrecedingText('Tiến độ Khảo sát phụ trợ');
  if (!tblSurvey && tblAir) {
    const clonedTable = doc.cloneTableAndHeader(tblAir, 4);
    if (clonedTable) {
      tblSurvey = clonedTable;
      // Replace the header text for the newly cloned section
      const paragraphs = doc.getParagraphs();
      for (let i = paragraphs.length - 1; i >= 0; i--) {
        const text = paragraphs[i].textContent;
        if (text && text.toLowerCase().includes('tiến độ vệ sinh máy lạnh')) {
          doc.replaceParagraph(i, text.replace(/tiến độ vệ sinh máy lạnh/i, 'Tiến độ Khảo sát phụ trợ'));
          doc.replaceParagraph(i + 1, 'Mục tiêu: 100% CSHT');
          break;
        }
      }
    }
  }

  // Write data to the 4th table
  if (tblSurvey) {
    doc.writeTableMatrix(tblSurvey, survey);
  }

  // We don't have file modification time from Blob URL easily, so we just use current date
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const value = `Thời gian lấy báo cáo: ${d}/${m}/${y}`;
  // Replace all instances of "Thời gian lấy báo cáo:" with current date
  const paras = doc.getParagraphs();
  for (let i = 0; i < paras.length; i++) {
    const text = paras[i].textContent;
    if (text && text.includes('Thời gian lấy báo cáo:')) {
      doc.replaceParagraph(i, value);
    }
  }
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
    { sheetName: 'XLSC MANE', prefix: '1. Kết quả phiếu XLSC MANE' },
    { sheetName: 'XLSC ACCESS', prefix: '2. Kết quả phiếu XLSC ACCESS' },
    { sheetName: 'XLSC VÔ TUYẾN', prefix: '3. Kết quả phiếu XLSC VÔ TUYẾN' },
  ];
  let reportMonth: any = null;

  for (const m of mappings) {
    const sheet = workbook.Sheets[m.sheetName];
    if (!sheet) continue;
    const matrix = xlscMatrix(sheet);
    
    const table = doc.findTableByPrecedingText(m.prefix);
    if (table) {
      doc.resizeTableRows(table, matrix.length);
      doc.writeTableMatrix(table, matrix);
    }
    
    const titleCell = sheet[xlsx.utils.encode_cell({r: 0, c: 0})];
    const dateRange = parseXlscTitle(clean(titleCell ? titleCell.v : ''));
    if (dateRange) reportMonth = dateRange;

    const totalRow = rawMatrix(sheet, 10, 10, 1, 10)[0];
    
    // Find paragraphs to replace dynamically
    const paras = doc.getParagraphs();
    let foundIndex = -1;
    for (let i = 0; i < paras.length; i++) {
      if (paras[i].textContent?.includes(m.prefix)) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex >= 0) {
      // Find following specific texts and replace them
      for (let i = foundIndex; i < Math.min(foundIndex + 15, paras.length); i++) {
        const text = paras[i].textContent || '';
        if (dateRange && text.includes('Kỳ báo cáo:')) {
          doc.replaceParagraph(i, `Kỳ báo cáo: ${dateRange.start} – ${dateRange.end}`);
        } else if (text.includes('Tổng phiếu giao:')) {
          doc.replaceParagraph(i, `Tổng phiếu giao: ${integer(totalRow[1])} phiếu`);
        } else if (text.includes('Hoàn thành:')) {
          doc.replaceParagraph(i, `Hoàn thành: ${integer(totalRow[2])}/${integer(totalRow[1])} phiếu`);
        } else if (text.includes('Hoàn thành đúng hạn:')) {
          doc.replaceParagraph(i, `Hoàn thành đúng hạn: ${integer(totalRow[3])} phiếu`);
        } else if (text.includes('Hoàn thành quá hạn:')) {
          doc.replaceParagraph(i, `Hoàn thành quá hạn: ${integer(totalRow[4])} phiếu`);
        } else if (text.includes('Tỉ lệ đúng hạn:')) {
          doc.replaceParagraph(i, `Tỉ lệ đúng hạn: ${percent(totalRow[5], 2, true)}`);
        } else if (text.includes('Phiếu tồn quá hạn:')) {
          doc.replaceParagraph(i, `Phiếu tồn quá hạn: ${integer(totalRow[8])} phiếu`);
        }
      }
    }
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
  
  const table = doc.findTableByPrecedingText('GIẢI TRÌNH NGUYÊN NHÂN MẤT LIÊN LẠC TRẠM');
  if (table) {
    doc.resizeTableRows(table, matrix.length);
    doc.writeTableMatrix(table, matrix);
  }
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
  
  const headerTable = doc.findTableByInternalText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
  if (headerTable) {
    const cells = doc.getCells(doc.getRows(headerTable)[0]);
    if (cells.length > 1) {
      doc.replaceCell(cells[1], `Tây Ninh, ngày ${day} tháng ${month} năm ${currentYear}`);
    }
  }

  doc.replaceParagraphByTextMatch(/V\/v thực hiện công việc trọng tâm trong tuần \d+ năm \d+/, `V/v thực hiện công việc trọng tâm trong tuần ${weekStr} năm ${currentYear}`);
  doc.replaceParagraphByTextMatch(/và kế hoạch thực hiện nhiệm vụ tuần \d+/, `và kế hoạch thực hiện nhiệm vụ tuần ${planWeek}`);
  doc.replaceParagraphByTextMatch(/Trung tâm Hạ tầng báo cáo kết quả thực hiện công việc trọng tâm trong tuần \d+ năm \d+ như sau:/, `Trung tâm Hạ tầng báo cáo kết quả thực hiện công việc trọng tâm trong tuần ${weekStr} năm ${currentYear} như sau:`);
  doc.replaceParagraphByTextMatch(/Trên đây là báo cáo kết quả thực hiện công việc tuần \d+ năm \d+./, `Trên đây là báo cáo kết quả thực hiện công việc tuần ${weekStr} năm ${currentYear}.`);
}
