/**
 * parseMYTV.ts – Parser cho báo cáo MyTV
 * File Excel: 3. BÁO CÁO MYTV_TÂN.xlsx
 *
 * Sheet: Sheet1
 * - row2,col7 = qosScore% → r=1, c=6
 * - row2,col8 = qosRank   → r=1, c=7
 * - row6,col7 = qoeScore% → r=5, c=6
 * - row6,col8 = qoeRank   → r=5, c=7
 * - rows 2-5, cols 4,5: qos items (label, value)  → r=1..4, c=3,4
 * - rows 6-15, cols 4,5: qoe items (label, value) → r=5..14, c=3,4
 */

import {
  loadSheet,
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

interface MyTVItem {
  label: string;
  value: number | null;
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseMYTV(buffer: Buffer): ReportBlock {
  const sheet = loadSheet(buffer, 'Sheet1');

  const maxRow = getSheetMaxRow(sheet);
  
  let qosScore: number | null = null;
  let qosRank: string = '';
  let qoeScore: number | null = null;
  let qoeRank: string = '';

  const qosItems: MyTVItem[] = [];
  const qoeItems: MyTVItem[] = [];

  let currentCategory: 'qos' | 'qoe' | null = null;

  for (let r = 1; r <= maxRow; r++) {
    const scoreColVal = cellValue(sheet, r, 6); // col 7
    const rankColVal = txt(cellValue(sheet, r, 7)); // col 8
    
    const hasScore = scoreColVal !== null && scoreColVal !== undefined && String(scoreColVal).trim() !== '';
    const hasRank = rankColVal !== '';

    // Nếu dòng này có chứa điểm số tổng hoặc xếp hạng (dấu hiệu của một nhóm mới do ô bị merge)
    if (hasScore || hasRank) {
      if (currentCategory === null) {
        currentCategory = 'qos';
        qosScore = normalizePercent(scoreColVal);
        qosRank = rankColVal;
      } else if (currentCategory === 'qos') {
        currentCategory = 'qoe';
        qoeScore = normalizePercent(scoreColVal);
        qoeRank = rankColVal;
      }
    }

    const label = txt(cellValue(sheet, r, 3)); // col 4
    const rawVal = cellValue(sheet, r, 4);     // col 5

    // Bỏ qua dòng trống hoặc dòng header
    if (!label || label.toLowerCase().includes('tiêu chí') || label.toLowerCase() === 'chỉ tiêu' || label.toLowerCase() === 'kết quả') {
      continue;
    }

    if (currentCategory === 'qos') {
      qosItems.push({ label, value: normalizePercent(rawVal) });
    } else if (currentCategory === 'qoe') {
      qoeItems.push({ label, value: normalizePercent(rawVal) });
    }
  }

  // ─── Tính toán tone ───────────────────────────────────────────────────────
  const overallTone: Tone =
    (qosScore ?? 0) < 85 || (qoeScore ?? 0) < 80
      ? 'critical'
      : (qosScore ?? 0) < 90 || (qoeScore ?? 0) < 85
      ? 'warning'
      : 'positive';

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics: MetricItem[] = [
    {
      label: 'Điểm QoS MyTV',
      value: pct(qosScore),
      tone: toneFromRatio(qosScore ?? 0, 90, 85),
    },
    {
      label: 'Xếp hạng QoS',
      value: qosRank || 'N/A',
      tone: 'info',
    },
    {
      label: 'Điểm QoE MyTV',
      value: pct(qoeScore),
      tone: toneFromRatio(qoeScore ?? 0, 85, 80),
    },
    {
      label: 'Xếp hạng QoE',
      value: qoeRank || 'N/A',
      tone: 'info',
    },
    {
      label: 'Số tiêu chí QoS',
      value: whole(qosItems.length),
      tone: 'info',
    },
    {
      label: 'Số tiêu chí QoE',
      value: whole(qoeItems.length),
      tone: 'info',
    },
  ];

  // ─── Chart: QoS tiêu chí ─────────────────────────────────────────────────
  const qosChartItems: ChartItem[] = qosItems.map((item) => ({
    label: item.label,
    value: item.value ?? 0,
    display: pct(item.value),
    note: '',
    tone: toneFromRatio(item.value ?? 0, 90, 85),
  }));

  // ─── Table: Chi tiết QoE ──────────────────────────────────────────────────
  const table: TableData = {
    title: 'Chi tiết tiêu chí QoE MyTV',
    columns: ['Tiêu chí', 'Điểm'],
    rows: qoeItems.map((item) => ({
      'Tiêu chí': item.label,
      'Điểm': pct(item.value),
    })),
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (qosScore !== null)
    insights.push(
      `QoS MyTV đạt ${pct(qosScore)} - xếp hạng ${qosRank || 'chưa có'}`
    );
  if (qoeScore !== null)
    insights.push(
      `QoE MyTV đạt ${pct(qoeScore)} - xếp hạng ${qoeRank || 'chưa có'}`
    );

  // Tiêu chí QoS thấp nhất
  const minQoS = qosItems.reduce<MyTVItem | null>(
    (min, item) =>
      item.value !== null &&
      (min === null || (item.value ?? 0) < (min.value ?? 100))
        ? item
        : min,
    null
  );
  if (minQoS && minQoS.value !== null)
    insights.push(
      `Tiêu chí QoS thấp nhất: "${minQoS.label}" (${pct(minQoS.value)})`
    );

  // Tiêu chí QoE thấp nhất
  const minQoE = qoeItems.reduce<MyTVItem | null>(
    (min, item) =>
      item.value !== null &&
      (min === null || (item.value ?? 0) < (min.value ?? 100))
        ? item
        : min,
    null
  );
  if (minQoE && minQoE.value !== null)
    insights.push(
      `Tiêu chí QoE thấp nhất: "${minQoE.label}" (${pct(minQoE.value)})`
    );

  return {
    id: 'mytv',
    group: 'service',
    title: 'Báo cáo MyTV',
    kicker: 'Truyền hình MyTV',
    tone: overallTone,
    summary: `QoS ${pct(qosScore)} (hạng ${qosRank}), QoE ${pct(qoeScore)} (hạng ${qoeRank}).`,
    metrics,
    insights,
    chart: {
      title: 'Điểm QoS theo tiêu chí',
      items: qosChartItems,
    },
    table,
    list: {
      title: 'Điểm QoS các tiêu chí',
      items: qosItems.map((item) => `${item.label}: ${pct(item.value)}`),
    },
    raw: {
      qosScore,
      qosRank,
      qoeScore,
      qoeRank,
      qosItems,
      qoeItems,
    },
  };
}
