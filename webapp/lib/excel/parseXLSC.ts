/**
 * parseXLSC.ts – Parser cho báo cáo XLSC (Xử lý sự cố)
 * File Excel: 7.BÁO CÁO XLSC_TUẤN.xlsx
 *
 * Sheets được parse:
 * - XLSC MANE: tổng hợp sự cố mạng AN
 * - XLSC ACCESS: tổng hợp sự cố mạng Access
 * - XLSC VÔ TUYẾN: tổng hợp sự cố vô tuyến
 * - PHIẾU QUÁ HẠN: danh sách phiếu sự cố quá hạn
 *
 * Chi tiết mỗi sheet XLSC:
 * - row10 (r=9): total row: col2=totalAssigned(c=1), col3=done(c=2), col6=ontime%(c=5),
 *                col9=overdueCount(c=8), col10=overdueRatio%(c=9)
 *
 * PHIẾU QUÁ HẠN:
 * - Khi cell chứa 'phiếu quá hạn' → bắt đầu nhóm
 * - Rows sau header_seen=true → parse record, col9=team(c=8)
 */

import {
  loadSheets,
  cellValue,
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

interface XLSCSummary {
  sheetName: string;
  totalAssigned: number | null;
  done: number | null;
  ontime: number | null;       // %
  overdueCount: number | null;
  overdueRatio: number | null; // %
}

interface XLSCOverdueRecord {
  group: string;       // Loại phiếu quá hạn
  team: string;        // col9
  rawRow: number;      // row index để debug
  [key: string]: string | number; // các cột khác
}

// ─── Helper: parse summary row ────────────────────────────────────────────────

function parseSummarySheet(
  sheet: ReturnType<typeof loadSheets>[string],
  sheetName: string
): XLSCSummary {
  // row10 → r=9
  const r = 9;
  return {
    sheetName,
    totalAssigned: num(cellValue(sheet, r, 1)),            // col2
    done: num(cellValue(sheet, r, 2)),                     // col3
    ontime: normalizePercent(cellValue(sheet, r, 5)),      // col6
    overdueCount: num(cellValue(sheet, r, 8)),             // col9
    overdueRatio: normalizePercent(cellValue(sheet, r, 9)), // col10
  };
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseXLSC(buffer: Buffer): ReportBlock {
  const sheets = loadSheets(buffer, [
    'XLSC MANE',
    'XLSC ACCESS',
    'XLSC VÔ TUYẾN',
    'PHIẾU QUÁ HẠN',
  ]);

  // ── Parse 3 sheets XLSC ──────────────────────────────────────────────────
  const maneSummary = parseSummarySheet(sheets['XLSC MANE'], 'XLSC MANE');
  const accessSummary = parseSummarySheet(sheets['XLSC ACCESS'], 'XLSC ACCESS');
  const vtSummary = parseSummarySheet(sheets['XLSC VÔ TUYẾN'], 'XLSC VÔ TUYẾN');

  const summaries: XLSCSummary[] = [maneSummary, accessSummary, vtSummary];

  // ── Parse PHIẾU QUÁ HẠN ───────────────────────────────────────────────────
  const sheetPQH = sheets['PHIẾU QUÁ HẠN'];
  const maxRowPQH = getSheetMaxRow(sheetPQH);
  const overdueRecords: XLSCOverdueRecord[] = [];
  let currentGroup = '';
  let headerSeen = false;

  for (let r = 0; r <= maxRowPQH; r++) {
    // Tìm cell chứa 'phiếu quá hạn' để xác định nhóm
    let foundGroupHeader = false;
    for (let c = 0; c <= 15; c++) {
      const cellTxt = txt(cellValue(sheetPQH, r, c)).toLowerCase();
      if (cellTxt.includes('phiếu quá hạn')) {
        currentGroup = txt(cellValue(sheetPQH, r, c));
        headerSeen = true;
        foundGroupHeader = true;
        break;
      }
    }

    if (foundGroupHeader) continue;

    // Nếu đã thấy header, parse data rows
    if (headerSeen) {
      const team = txt(cellValue(sheetPQH, r, 8)); // col9
      // Bỏ qua hàng trống hoặc hàng header phụ
      if (!team) {
        // Nếu gặp hàng trống liên tiếp, có thể là phân cách nhóm
        continue;
      }

      // Kiểm tra nếu là hàng header (không phải dữ liệu)
      const col1Val = txt(cellValue(sheetPQH, r, 0));
      if (
        col1Val.toLowerCase().includes('stt') ||
        col1Val.toLowerCase().includes('số tt')
      ) {
        continue;
      }

      // Đọc tất cả cột hữu ích
      const record: XLSCOverdueRecord = {
        group: currentGroup,
        team,
        rawRow: r,
        col1: txt(cellValue(sheetPQH, r, 0)),
        col2: txt(cellValue(sheetPQH, r, 1)),
        col3: txt(cellValue(sheetPQH, r, 2)),
        col4: txt(cellValue(sheetPQH, r, 3)),
        col5: txt(cellValue(sheetPQH, r, 4)),
        col6: txt(cellValue(sheetPQH, r, 5)),
        col7: txt(cellValue(sheetPQH, r, 6)),
        col8: txt(cellValue(sheetPQH, r, 7)),
      };
      overdueRecords.push(record);
    }
  }

  // ─── Tính toán tổng hợp ───────────────────────────────────────────────────
  const totalAssignedAll = summaries.reduce(
    (s, sum) => s + (sum.totalAssigned ?? 0),
    0
  );
  const totalDoneAll = summaries.reduce(
    (s, sum) => s + (sum.done ?? 0),
    0
  );
  const totalOntimeAvg =
    summaries.filter((s) => s.ontime !== null).length > 0
      ? summaries.reduce((s, sum) => s + (sum.ontime ?? 0), 0) /
        summaries.filter((s) => s.ontime !== null).length
      : null;

  const overallTone: Tone =
    (totalOntimeAvg ?? 0) < 80
      ? 'critical'
      : (totalOntimeAvg ?? 0) < 90
      ? 'warning'
      : 'positive';

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics: MetricItem[] = [
    ...summaries.map((s) => ({
      label: `Đúng hạn ${s.sheetName.replace('XLSC ', '')}`,
      value: pct(s.ontime),
      tone: toneFromRatio(s.ontime ?? 0, 90, 80) as Tone,
    })),
    {
      label: 'Tổng phiếu',
      value: whole(totalAssignedAll),
      tone: 'info' as Tone,
    },
    {
      label: 'Tổng xong',
      value: whole(totalDoneAll),
      tone: 'info' as Tone,
    },
    {
      label: 'Phiếu quá hạn',
      value: whole(overdueRecords.length),
      tone: overdueRecords.length > 20 ? 'critical' : overdueRecords.length > 5 ? 'warning' : 'positive',
    },
  ];

  // ─── Chart: Tỉ lệ đúng hạn và quá hạn theo sheet ────────────────────────
  const chartItems: ChartItem[] = summaries.map((s) => ({
    label: s.sheetName,
    value: s.ontime ?? 0,
    display: pct(s.ontime),
    note: `Quá hạn: ${whole(s.overdueCount)} (${pct(s.overdueRatio)})`,
    tone: toneFromRatio(s.ontime ?? 0, 90, 80),
  }));

  // ─── Table: Chi tiết phiếu quá hạn ───────────────────────────────────────
  // Đếm phiếu quá hạn theo team
  const overdueByTeam: Record<string, number> = {};
  for (const rec of overdueRecords) {
    if (rec.team) {
      overdueByTeam[rec.team] = (overdueByTeam[rec.team] ?? 0) + 1;
    }
  }

  const table: TableData = {
    title: 'Phiếu quá hạn theo team',
    columns: ['Team', 'Số phiếu quá hạn'],
    rows: Object.entries(overdueByTeam)
      .sort((a, b) => b[1] - a[1])
      .map(([team, count]) => ({
        'Team': team,
        'Số phiếu quá hạn': whole(count),
      })),
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (totalOntimeAvg !== null)
    insights.push(
      `Tỉ lệ đúng hạn trung bình 3 loại XLSC: ${totalOntimeAvg.toFixed(2)}%`
    );

  for (const s of summaries) {
    insights.push(
      `${s.sheetName}: ${whole(s.done)}/${whole(s.totalAssigned)} đúng hạn (${pct(s.ontime)}), quá hạn: ${whole(s.overdueCount)}`
    );
  }

  if (overdueRecords.length > 0) {
    const topTeam = Object.entries(overdueByTeam).sort((a, b) => b[1] - a[1])[0];
    if (topTeam)
      insights.push(
        `Team nhiều phiếu quá hạn nhất: ${topTeam[0]} (${topTeam[1]} phiếu)`
      );
  }

  return {
    id: 'xlsc',
    group: 'operation',
    title: 'Báo cáo XLSC',
    kicker: 'Xử lý sự cố',
    tone: overallTone,
    summary: `Đúng hạn TB ${totalOntimeAvg?.toFixed(2) ?? 'N/A'}%. Tổng ${whole(totalAssignedAll)} phiếu, ${whole(totalDoneAll)} hoàn thành. ${overdueRecords.length} phiếu quá hạn.`,
    metrics,
    insights,
    chart: {
      title: 'Tỉ lệ XLSC đúng hạn theo loại',
      items: chartItems,
    },
    table,
    list: {
      title: 'Chi tiết phiếu quá hạn',
      items: overdueRecords
        .slice(0, 30)
        .map(
          (r) =>
            `[${r.group}] Team: ${r.team} | ${r.col2} | ${r.col3}`
        ),
    },
    raw: {
      maneSummary,
      accessSummary,
      vtSummary,
      overdueRecords,
      overdueByTeam,
      totalAssignedAll,
      totalDoneAll,
      totalOntimeAvg,
    },
  };
}
