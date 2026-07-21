/**
 * parseFBB.ts – Parser cho báo cáo FBB (Fixed Broadband)
 * File Excel: 2. BÁO CÁO FBB_BAO.xlsx
 *
 * Sheets được parse:
 * - Thông tin chung: tổng quan QoS/QoE FBB
 * - Suy hao thuê bao: tỉ lệ suy hao theo team
 * - Chi tiết QoS FBB: điểm QoS theo team
 * - Chi tiết QoE FBB: điểm QoE theo team
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

interface FBBSuyHaoRow {
  team: string;
  center: string;
  lossCount: number | null;
  lossRatio: number | null; // %
  rating: string;
}

interface FBBQoSRow {
  team: string;
  score: number | null; // %
  note: string;
}

interface FBBQoERow {
  team: string;
  score: number | null; // %
  rating: string;
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseFBB(buffer: Buffer): ReportBlock {
  const sheets = loadSheets(buffer, [
    'Thông tin chung',
    'Suy hao thuê bao',
    'Chi tiết QoS FBB',
    'Chi tiết QoE FBB',
  ]);

  // ── Sheet 1: Thông tin chung ─────────────────────────────────────────────
  // qosTotal = row2,col6 → r=1, c=5 (0-indexed)
  // qoeTotal = row8,col6 → r=7, c=5
  // qosRating = row2,col7 → r=1, c=6
  // qoeRating = row8,col7 → r=7, c=6
  const sheetTC = sheets['Thông tin chung'];
  const qosTotal = normalizePercent(cellValue(sheetTC, 1, 5));
  const qoeTotal = normalizePercent(cellValue(sheetTC, 7, 5));
  const qosRating = txt(cellValue(sheetTC, 1, 6));
  const qoeRating = txt(cellValue(sheetTC, 7, 6));

  // ── Sheet 2: Suy hao thuê bao (rows 3+, cols 2,3,4,5,7) ──────────────────
  // Python: col2=team, col3=center, col4=lossCount, col5=lossRatio, col7=rating
  // 0-indexed: c=1, c=2, c=3, c=4, c=6
  const sheetSH = sheets['Suy hao thuê bao'];
  const maxRowSH = getSheetMaxRow(sheetSH);
  const suyHaoRows: FBBSuyHaoRow[] = [];

  for (let r = 2; r <= maxRowSH; r++) {
    // Python row 3+ → r=2+
    const team = txt(cellValue(sheetSH, r, 1)); // col2
    if (!team) continue;
    suyHaoRows.push({
      team,
      center: txt(cellValue(sheetSH, r, 2)),          // col3
      lossCount: num(cellValue(sheetSH, r, 3)),        // col4
      lossRatio: normalizePercent(cellValue(sheetSH, r, 4)), // col5
      rating: txt(cellValue(sheetSH, r, 6)),           // col7
    });
  }

  // ── Sheet 3: Chi tiết QoS FBB ─────────────────────────────────────────────
  // row2,col1 = narrative text → r=1, c=0
  // rows 10-18: team(col2), score%(col3), note(col4)
  // Python col2=idx1, col3=idx2, col4=idx3
  const sheetQoS = sheets['Chi tiết QoS FBB'];
  const qosNarrative = txt(cellValue(sheetQoS, 1, 0)); // row2,col1
  const qosRows: FBBQoSRow[] = [];

  for (let r = 9; r <= 17; r++) {
    // Python rows 10-18 → r=9..17
    const team = txt(cellValue(sheetQoS, r, 1)); // col2
    if (!team) continue;
    qosRows.push({
      team,
      score: normalizePercent(cellValue(sheetQoS, r, 2)), // col3
      note: txt(cellValue(sheetQoS, r, 3)),               // col4
    });
  }

  // ── Sheet 4: Chi tiết QoE FBB (rows 3-10, cols 2,3,4) ───────────────────
  // Python col2=idx1, col3=idx2, col4=idx3
  const sheetQoE = sheets['Chi tiết QoE FBB'];
  const qoeRows: FBBQoERow[] = [];

  for (let r = 2; r <= 9; r++) {
    // Python rows 3-10 → r=2..9
    const team = txt(cellValue(sheetQoE, r, 1)); // col2
    if (!team) continue;
    qoeRows.push({
      team,
      score: normalizePercent(cellValue(sheetQoE, r, 2)), // col3
      rating: txt(cellValue(sheetQoE, r, 3)),              // col4
    });
  }

  // ─── Tính toán tone và metrics ────────────────────────────────────────────
  const overallTone: Tone =
    (qosTotal ?? 0) < 90 || (qoeTotal ?? 0) < 85
      ? 'critical'
      : (qosTotal ?? 0) < 95 || (qoeTotal ?? 0) < 90
      ? 'warning'
      : 'positive';

  const metrics: MetricItem[] = [
    {
      label: 'QoS FBB',
      value: pct(qosTotal),
      tone: toneFromRatio(qosTotal ?? 0, 95, 90),
    },
    {
      label: 'Xếp hạng QoS',
      value: qosRating || 'N/A',
      tone: 'info',
    },
    {
      label: 'QoE FBB',
      value: pct(qoeTotal),
      tone: toneFromRatio(qoeTotal ?? 0, 90, 85),
    },
    {
      label: 'Xếp hạng QoE',
      value: qoeRating || 'N/A',
      tone: 'info',
    },
    {
      label: 'Số team suy hao',
      value: whole(suyHaoRows.length),
      tone: 'info',
    },
    {
      label: 'Tổng suy hao thuê bao',
      value: whole(suyHaoRows.reduce((s, r) => s + (r.lossCount ?? 0), 0)),
      tone: 'warning',
    },
  ];

  // ─── Chart: QoS từng team ─────────────────────────────────────────────────
  const chartItems: ChartItem[] = qosRows.map((row) => ({
    label: row.team,
    value: row.score ?? 0,
    display: pct(row.score),
    note: row.note,
    tone: toneFromRatio(row.score ?? 0, 95, 90),
  }));

  // ─── Table: Suy hao thuê bao ──────────────────────────────────────────────
  const table: TableData = {
    title: 'Suy hao thuê bao theo team',
    columns: ['Team', 'Trung tâm', 'Suy hao', 'Tỉ lệ', 'Xếp hạng'],
    rows: suyHaoRows.map((r) => ({
      'Team': r.team,
      'Trung tâm': r.center,
      'Suy hao': whole(r.lossCount),
      'Tỉ lệ': pct(r.lossRatio),
      'Xếp hạng': r.rating,
    })),
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (qosTotal !== null)
    insights.push(`QoS FBB đạt ${pct(qosTotal)} - xếp hạng ${qosRating}`);
  if (qoeTotal !== null)
    insights.push(`QoE FBB đạt ${pct(qoeTotal)} - xếp hạng ${qoeRating}`);
  if (qosNarrative)
    insights.push(qosNarrative.slice(0, 200));

  // Team có QoS thấp nhất
  const minQoSTeam = qosRows.reduce<FBBQoSRow | null>(
    (min, row) =>
      row.score !== null && (min === null || (row.score ?? 0) < (min.score ?? 100))
        ? row
        : min,
    null
  );
  if (minQoSTeam && minQoSTeam.score !== null)
    insights.push(
      `Team QoS thấp nhất: ${minQoSTeam.team} (${pct(minQoSTeam.score)})`
    );

  // Team suy hao cao nhất
  const maxLossTeam = suyHaoRows.reduce<FBBSuyHaoRow | null>(
    (max, row) =>
      row.lossRatio !== null &&
      (max === null || (row.lossRatio ?? 0) > (max.lossRatio ?? 0))
        ? row
        : max,
    null
  );
  if (maxLossTeam && maxLossTeam.lossRatio !== null)
    insights.push(
      `Team suy hao cao nhất: ${maxLossTeam.team} (${pct(maxLossTeam.lossRatio)})`
    );

  return {
    id: 'fbb',
    group: 'service',
    title: 'Báo cáo FBB',
    kicker: 'Fixed Broadband',
    tone: overallTone,
    summary: `QoS FBB ${pct(qosTotal)} (${qosRating}), QoE ${pct(qoeTotal)} (${qoeRating}).`,
    metrics,
    insights,
    chart: {
      title: 'QoS FBB theo team',
      items: chartItems,
    },
    table,
    list: {
      title: 'QoE từng team',
      items: qoeRows.map(
        (r) => `${r.team}: ${pct(r.score)} - ${r.rating}`
      ),
    },
    raw: {
      qosTotal,
      qoeTotal,
      qosRating,
      qoeRating,
      suyHaoRows,
      qosRows,
      qoeRows,
      qosNarrative,
    },
  };
}
