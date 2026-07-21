/**
 * parseMBB.ts – Parser cho báo cáo MBB (Mobile Broadband)
 * File Excel: 1. BÁO CÁO MBB_HUNG.xlsx
 *
 * Sheets được parse:
 * - Kết quả chung: tổng quan QoS/QoE toàn quốc và Tây Ninh
 * - So sánh các tỉnh: so sánh QoS/QoE theo tỉnh
 * - Kết quả chi tiết: chi tiết theo nhóm/thành phần
 * - Giải trình QoS: nguyên nhân QoS theo trạm
 * - Dự kiến tuần 30: kế hoạch sửa trạm tuần tới
 * - Phản ánh khách hàng: số phản ánh theo loại
 * - Giải trình QoE: nguyên nhân QoE theo trạm
 */

import {
  loadSheets,
  cellValue,
  cellText,
  txt,
  num,
  pct,
  whole,
  normalizePercent,
  toneFromRatio,
  getSheetMaxRow,
  type Tone,
  type ReportBlock,
  type MetricItem,
  type ChartItem,
  type TableData,
} from './utils';

// ─── Kiểu dữ liệu nội bộ ─────────────────────────────────────────────────────

interface MBBKetQuaRow {
  unit: string;
  qos: number | null;
  qoe: number | null;
}

interface MBBSoSanhRow {
  label: string;
  qosText: string;
  qoeText: string;
}

interface MBBChiTietRow {
  groupName: string;
  componentName: string;
  col3: string;
  col4: string;
  col5: string;
  col6: string;
}

interface MBBGiaiTrinhRow {
  area: string;
  station: string;
  cause: string;
  status: string;
}

interface MBBDuKienRow {
  area: string;
  station: string;
  cause: string;
  direction: string;
}

interface MBBPakhRow {
  label: string;
  count: number | null;
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseMBB(buffer: Buffer): ReportBlock {
  const sheets = loadSheets(buffer, [
    'Kết quả chung',
    'So sánh các tỉnh',
    'Kết quả chi tiết',
    'Giải trình QoS',
    'Dự kiến tuần 30',
    'Phản ánh khách hàng (PAKH)',
    'Giải trình QoE',
  ]);

  // ── Sheet 1: Kết quả chung (rows 5+, cols B,C,D = idx 1,2,3) ──────────────
  const sheetKQ = sheets['Kết quả chung'];
  const maxRowKQ = getSheetMaxRow(sheetKQ);
  const ketQuaRows: MBBKetQuaRow[] = [];

  for (let r = 4; r <= maxRowKQ; r++) {
    // Python row 5+ → 0-indexed r=4+
    const unit = txt(cellValue(sheetKQ, r, 1)); // col B = idx 1
    if (!unit) continue;
    const qosRaw = cellValue(sheetKQ, r, 2); // col C = idx 2
    const qoeRaw = cellValue(sheetKQ, r, 3); // col D = idx 3
    ketQuaRows.push({
      unit,
      qos: normalizePercent(qosRaw),
      qoe: normalizePercent(qoeRaw),
    });
  }

  // Tìm row Toàn quốc và Tây Ninh
  const toanQuoc = ketQuaRows.find((r) =>
    r.unit.toLowerCase().includes('toàn quốc')
  ) ?? { unit: 'Toàn quốc', qos: null, qoe: null };

  const tayNinh = ketQuaRows.find((r) =>
    r.unit.toLowerCase().includes('tây ninh')
  ) ?? { unit: 'Tây Ninh', qos: null, qoe: null };

  // ── Sheet 2: So sánh các tỉnh (rows 4+, cols A,B,C = idx 0,1,2) ───────────
  const sheetSS = sheets['So sánh các tỉnh'];
  const maxRowSS = getSheetMaxRow(sheetSS);
  const soSanhRows: MBBSoSanhRow[] = [];

  for (let r = 3; r <= maxRowSS; r++) {
    // Python row 4+ → r=3+
    const label = txt(cellValue(sheetSS, r, 0));
    if (!label) continue;
    soSanhRows.push({
      label,
      qosText: cellText(sheetSS, r, 1),
      qoeText: cellText(sheetSS, r, 2),
    });
  }

  // ── Sheet 3: Kết quả chi tiết (rows 4+, cols B,C,D,F,G,H = idx 1,2,3,5,6,7) ─
  const sheetCT = sheets['Kết quả chi tiết'];
  const maxRowCT = getSheetMaxRow(sheetCT);
  const chiTietRows: MBBChiTietRow[] = [];

  for (let r = 3; r <= maxRowCT; r++) {
    const groupName = txt(cellValue(sheetCT, r, 1));   // col B
    const componentName = txt(cellValue(sheetCT, r, 2)); // col C
    if (!groupName && !componentName) continue;
    chiTietRows.push({
      groupName,
      componentName,
      col3: cellText(sheetCT, r, 3), // col D
      col4: cellText(sheetCT, r, 5), // col F
      col5: cellText(sheetCT, r, 6), // col G
      col6: cellText(sheetCT, r, 7), // col H
    });
  }

  // ── Sheet 4: Giải trình QoS (rows 5+, cols A,B,C,D = idx 0,1,2,3) ─────────
  const sheetGTQoS = sheets['Giải trình QoS'];
  const maxRowGTQoS = getSheetMaxRow(sheetGTQoS);
  const giaiTrinhQoS: MBBGiaiTrinhRow[] = [];

  for (let r = 4; r <= maxRowGTQoS; r++) {
    const area = txt(cellValue(sheetGTQoS, r, 0));
    const station = txt(cellValue(sheetGTQoS, r, 1));
    if (!area && !station) continue;
    giaiTrinhQoS.push({
      area,
      station,
      cause: txt(cellValue(sheetGTQoS, r, 2)),
      status: txt(cellValue(sheetGTQoS, r, 3)),
    });
  }

  // ── Sheet 5: Dự kiến tuần 30 (rows 4+, cols A,B,C,D = idx 0,1,2,3) ────────
  const sheetDK = sheets['Dự kiến tuần 30'];
  const maxRowDK = getSheetMaxRow(sheetDK);
  const duKienRows: MBBDuKienRow[] = [];

  for (let r = 3; r <= maxRowDK; r++) {
    const area = txt(cellValue(sheetDK, r, 0));
    const station = txt(cellValue(sheetDK, r, 1));
    if (!area && !station) continue;
    duKienRows.push({
      area,
      station,
      cause: txt(cellValue(sheetDK, r, 2)),
      direction: txt(cellValue(sheetDK, r, 3)),
    });
  }

  // ── Sheet 6: Phản ánh khách hàng (rows 3+, cols B,C = idx 1,2) ─────────────
  const sheetPAKH = sheets['Phản ánh khách hàng (PAKH)'];
  const maxRowPAKH = getSheetMaxRow(sheetPAKH);
  const pakhRows: MBBPakhRow[] = [];

  for (let r = 2; r <= maxRowPAKH; r++) {
    const label = txt(cellValue(sheetPAKH, r, 1)); // col B
    if (!label) continue;
    pakhRows.push({
      label,
      count: num(cellValue(sheetPAKH, r, 2)), // col C
    });
  }

  // ── Sheet 7: Giải trình QoE (rows 3+, cols A,B,C,D = idx 0,1,2,3) ─────────
  const sheetGTQoE = sheets['Giải trình QoE'];
  const maxRowGTQoE = getSheetMaxRow(sheetGTQoE);
  const giaiTrinhQoE: MBBGiaiTrinhRow[] = [];

  for (let r = 2; r <= maxRowGTQoE; r++) {
    const area = txt(cellValue(sheetGTQoE, r, 0));
    const station = txt(cellValue(sheetGTQoE, r, 1));
    if (!area && !station) continue;
    giaiTrinhQoE.push({
      area,
      station,
      cause: txt(cellValue(sheetGTQoE, r, 2)),
      status: txt(cellValue(sheetGTQoE, r, 3)),
    });
  }

  // ─── Tính toán tone và metrics ───────────────────────────────────────────────
  const qosTQ = toanQuoc.qos ?? 0;
  const qoeTQ = toanQuoc.qoe ?? 0;
  const overallTone: Tone =
    qosTQ < 90 || qoeTQ < 85 ? 'critical' : qosTQ < 95 || qoeTQ < 90 ? 'warning' : 'positive';

  const metrics: MetricItem[] = [
    {
      label: 'QoS Toàn quốc',
      value: pct(toanQuoc.qos),
      tone: toneFromRatio(qosTQ, 95, 90),
    },
    {
      label: 'QoE Toàn quốc',
      value: pct(toanQuoc.qoe),
      tone: toneFromRatio(qoeTQ, 90, 85),
    },
    {
      label: 'QoS Tây Ninh',
      value: pct(tayNinh.qos),
      tone: toneFromRatio(tayNinh.qos ?? 0, 95, 90),
    },
    {
      label: 'QoE Tây Ninh',
      value: pct(tayNinh.qoe),
      tone: toneFromRatio(tayNinh.qoe ?? 0, 90, 85),
    },
    {
      label: 'Số trạm giải trình QoS',
      value: whole(giaiTrinhQoS.length),
      tone: giaiTrinhQoS.length > 10 ? 'warning' : 'info',
    },
    {
      label: 'Số trạm giải trình QoE',
      value: whole(giaiTrinhQoE.length),
      tone: giaiTrinhQoE.length > 5 ? 'warning' : 'info',
    },
  ];

  // ─── Chart: So sánh QoS/QoE các đơn vị ─────────────────────────────────────
  const chartItems: ChartItem[] = ketQuaRows.slice(0, 15).map((row) => ({
    label: row.unit,
    value: row.qos ?? 0,
    display: pct(row.qos),
    note: `QoE: ${pct(row.qoe)}`,
    tone: toneFromRatio(row.qos ?? 0, 95, 90),
  }));

  // ─── Table: Chi tiết các tỉnh ────────────────────────────────────────────────
  const table: TableData = {
    title: 'So sánh QoS/QoE các tỉnh',
    columns: ['Đơn vị', 'QoS', 'QoE'],
    rows: soSanhRows.map((r) => ({
      'Đơn vị': r.label,
      'QoS': r.qosText,
      'QoE': r.qoeText,
    })),
  };

  // ─── Insights ────────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (toanQuoc.qos !== null)
    insights.push(`QoS toàn quốc đạt ${pct(toanQuoc.qos)} (mục tiêu ≥ 95%)`);
  if (toanQuoc.qoe !== null)
    insights.push(`QoE toàn quốc đạt ${pct(toanQuoc.qoe)} (mục tiêu ≥ 90%)`);
  if (giaiTrinhQoS.length > 0)
    insights.push(`Có ${giaiTrinhQoS.length} trạm cần giải trình QoS`);
  if (duKienRows.length > 0)
    insights.push(`Dự kiến xử lý ${duKienRows.length} trạm trong tuần tới`);
  const totalPakh = pakhRows.reduce((s, r) => s + (r.count ?? 0), 0);
  if (totalPakh > 0)
    insights.push(`Tổng phản ánh khách hàng: ${whole(totalPakh)} phiếu`);

  return {
    id: 'mbb',
    group: 'service',
    title: 'Báo cáo MBB',
    kicker: 'Mobile Broadband',
    tone: overallTone,
    summary: `QoS toàn quốc ${pct(toanQuoc.qos)}, QoE ${pct(toanQuoc.qoe)}. Tây Ninh QoS ${pct(tayNinh.qos)}, QoE ${pct(tayNinh.qoe)}.`,
    metrics,
    insights,
    chart: {
      title: 'QoS theo đơn vị',
      items: chartItems,
    },
    table,
    list: {
      title: 'Giải trình QoS',
      items: giaiTrinhQoS
        .slice(0, 20)
        .map(
          (r) =>
            `[${r.area}] ${r.station}: ${r.cause} → ${r.status}`
        ),
    },
    raw: {
      ketQuaRows,
      soSanhRows,
      chiTietRows,
      giaiTrinhQoS,
      duKienRows,
      pakhRows,
      giaiTrinhQoE,
      toanQuoc,
      tayNinh,
    },
  };
}
