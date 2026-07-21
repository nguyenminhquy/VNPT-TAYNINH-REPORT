/**
 * parseMLL.ts – Parser cho báo cáo MLL (Mạng lưới lưu động / Mạng lưới lỗi)
 * File Excel: 4. BÁO CÁO MLL_KHANH.xlsx
 *
 * Sheets được parse:
 * - BC MLL tuần: header danh mục từ rows 2-3, totals tỉnh row 4, teams rows 5-11
 * - XLSC Đúng hạn: tỉ lệ xử lý sự cố đúng hạn theo team
 * - Trạm theo NV: danh sách trạm và thời gian xử lý theo nhân viên
 * - TH: tổng hợp theo tháng (headers row 2, values row 3, cols 3-8)
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

interface MLLCategoryHeader {
  colIndex: number;
  label: string;
}

interface MLLTeamRow {
  team: string;
  values: Record<string, number | null>; // keyed by category label
}

interface MLLXlscRow {
  team: string;
  rate: number | null; // %
}

interface MLLStationRow {
  station: string;
  duration: string;
}

interface MLLMonthData {
  month: string;
  value: number | null;
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseMLL(buffer: Buffer): ReportBlock {
  const sheets = loadSheets(buffer, [
    'BC MLL tuần',
    'XLSC Đúng hạn',
    'Trạm theo NV',
    'TH',
  ]);

  // ── Sheet 1: BC MLL tuần ─────────────────────────────────────────────────
  // categoryHeaders từ row2-3, cols 4+ → r=1..2, c=3+
  // provinceTotal từ row4 → r=3
  // teamTotals rows 5-11 → r=4..10
  const sheetBC = sheets['BC MLL tuần'];

  // Đọc category headers từ row 2 (r=1), cols 4+ (c=3+)
  const categoryHeaders: MLLCategoryHeader[] = [];
  const maxColBC = (() => {
    if (!sheetBC['!ref']) return 20;
    const range = require('xlsx').utils.decode_range(sheetBC['!ref']);
    return range.e.c;
  })();

  // Đọc 2 hàng headers để ghép nhãn
  for (let c = 3; c <= maxColBC; c++) {
    const h1 = txt(cellValue(sheetBC, 1, c)); // row2
    const h2 = txt(cellValue(sheetBC, 2, c)); // row3
    const label = [h1, h2].filter(Boolean).join(' - ');
    if (label) {
      categoryHeaders.push({ colIndex: c, label });
    }
  }

  // Đọc province total (row 4 → r=3)
  const provinceTotal: Record<string, number | null> = {};
  for (const cat of categoryHeaders) {
    provinceTotal[cat.label] = num(cellValue(sheetBC, 3, cat.colIndex));
  }

  // Đọc team totals rows 5-11 → r=4..10
  const teamTotals: MLLTeamRow[] = [];
  for (let r = 4; r <= 10; r++) {
    const team = txt(cellValue(sheetBC, r, 1)); // col 2 → c=1
    if (!team) continue;
    const values: Record<string, number | null> = {};
    for (const cat of categoryHeaders) {
      values[cat.label] = num(cellValue(sheetBC, r, cat.colIndex));
    }
    teamTotals.push({ team, values });
  }

  // ── Sheet 2: XLSC Đúng hạn (rows 5-11 → r=4..10, col2=team, col6=rate%) ──
  // Python: col2=idx1, col6=idx5
  const sheetXLSC = sheets['XLSC Đúng hạn'];
  const xlscRows: MLLXlscRow[] = [];

  for (let r = 4; r <= 10; r++) {
    const team = txt(cellValue(sheetXLSC, r, 1)); // col2
    if (!team) continue;
    xlscRows.push({
      team,
      rate: normalizePercent(cellValue(sheetXLSC, r, 5)), // col6
    });
  }

  // ── Sheet 3: Trạm theo NV (rows 2+, col2=station, col7=duration) ─────────
  // Python: col2=idx1, col7=idx6
  const sheetTram = sheets['Trạm theo NV'];
  const maxRowTram = getSheetMaxRow(sheetTram);
  const stationRows: MLLStationRow[] = [];

  for (let r = 1; r <= maxRowTram; r++) {
    const station = txt(cellValue(sheetTram, r, 1)); // col2
    if (!station) continue;
    stationRows.push({
      station,
      duration: cellText(sheetTram, r, 6), // col7
    });
  }

  // ── Sheet 4: TH (month headers row2 cols 3-8, values row3 cols 3-8) ───────
  // Python: r=1, c=2..7 cho headers; r=2, c=2..7 cho values
  const sheetTH = sheets['TH'];
  const monthData: MLLMonthData[] = [];

  for (let c = 2; c <= 7; c++) {
    const month = txt(cellValue(sheetTH, 1, c)); // row2
    const value = num(cellValue(sheetTH, 2, c)); // row3
    if (!month) continue;
    monthData.push({ month, value });
  }

  // ─── Tính toán tổng hợp ───────────────────────────────────────────────────
  const avgXlscRate =
    xlscRows.length > 0
      ? xlscRows.reduce((s, r) => s + (r.rate ?? 0), 0) / xlscRows.length
      : null;

  const overallTone: Tone =
    (avgXlscRate ?? 0) < 80
      ? 'critical'
      : (avgXlscRate ?? 0) < 90
      ? 'warning'
      : 'positive';

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics: MetricItem[] = [
    {
      label: 'Tỉ lệ XLSC đúng hạn TB',
      value: pct(avgXlscRate),
      tone: toneFromRatio(avgXlscRate ?? 0, 90, 80),
    },
    {
      label: 'Số team báo cáo',
      value: whole(teamTotals.length),
      tone: 'info',
    },
    {
      label: 'Số trạm theo NV',
      value: whole(stationRows.length),
      tone: stationRows.length > 50 ? 'warning' : 'info',
    },
    {
      label: 'Số tháng tổng hợp',
      value: whole(monthData.length),
      tone: 'info',
    },
  ];

  // ─── Chart: XLSC Đúng hạn theo team ──────────────────────────────────────
  const chartItems: ChartItem[] = xlscRows.map((row) => ({
    label: row.team,
    value: row.rate ?? 0,
    display: pct(row.rate),
    note: '',
    tone: toneFromRatio(row.rate ?? 0, 90, 80),
  }));

  // ─── Table: Team totals ───────────────────────────────────────────────────
  const catLabels = categoryHeaders.map((c) => c.label);
  const table: TableData = {
    title: 'BC MLL theo team',
    columns: ['Team', ...catLabels],
    rows: teamTotals.map((row) => {
      const r: Record<string, string> = { 'Team': row.team };
      for (const label of catLabels) {
        r[label] = whole(row.values[label] ?? null);
      }
      return r;
    }),
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (avgXlscRate !== null)
    insights.push(
      `Tỉ lệ XLSC đúng hạn trung bình: ${pct(avgXlscRate)}`
    );

  const minXlsc = xlscRows.reduce<MLLXlscRow | null>(
    (min, r) =>
      r.rate !== null && (min === null || (r.rate ?? 0) < (min.rate ?? 100))
        ? r
        : min,
    null
  );
  if (minXlsc && minXlsc.rate !== null)
    insights.push(
      `Team đúng hạn thấp nhất: ${minXlsc.team} (${pct(minXlsc.rate)})`
    );

  if (stationRows.length > 0)
    insights.push(
      `Tổng số trạm theo dõi NV: ${whole(stationRows.length)} trạm`
    );

  const latestMonth = monthData[monthData.length - 1];
  if (latestMonth && latestMonth.value !== null)
    insights.push(
      `Tháng ${latestMonth.month}: ${whole(latestMonth.value)}`
    );

  return {
    id: 'mll',
    group: 'operation',
    title: 'Báo cáo MLL',
    kicker: 'Mạng lưới lưu động',
    tone: overallTone,
    summary: `Tỉ lệ XLSC đúng hạn TB ${pct(avgXlscRate)}. ${stationRows.length} trạm theo dõi.`,
    metrics,
    insights,
    chart: {
      title: 'Tỉ lệ XLSC đúng hạn theo team',
      items: chartItems,
    },
    table,
    list: {
      title: 'Trạm tồn đọng theo NV',
      items: stationRows
        .slice(0, 20)
        .map((r) => `${r.station}: ${r.duration}`),
    },
    raw: {
      categoryHeaders,
      provinceTotal,
      teamTotals,
      xlscRows,
      stationRows,
      monthData,
    },
  };
}
