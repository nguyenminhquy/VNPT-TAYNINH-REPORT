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

  // ── Điểm tổng QoS/QoE ──────────────────────────────────────────────────────
  // Python: row2,col7 → 0-indexed r=1, c=6
  const qosScore = normalizePercent(cellValue(sheet, 1, 6));
  const qosRank = txt(cellValue(sheet, 1, 7));

  // Python: row6,col7 → 0-indexed r=5, c=6
  const qoeScore = normalizePercent(cellValue(sheet, 5, 6));
  const qoeRank = txt(cellValue(sheet, 5, 7));

  // ── QoS items: rows 2-5, cols 4,5 → r=1..4, c=3,4 ─────────────────────────
  const qosItems: MyTVItem[] = [];
  for (let r = 1; r <= 4; r++) {
    const label = txt(cellValue(sheet, r, 3)); // col 4
    const rawVal = cellValue(sheet, r, 4);      // col 5
    if (!label) continue;
    qosItems.push({
      label,
      value: normalizePercent(rawVal),
    });
  }

  // ── QoE items: rows 6-15, cols 4,5 → r=5..14, c=3,4 ──────────────────────
  const qoeItems: MyTVItem[] = [];
  for (let r = 5; r <= 14; r++) {
    const label = txt(cellValue(sheet, r, 3)); // col 4
    const rawVal = cellValue(sheet, r, 4);      // col 5
    if (!label) continue;
    qoeItems.push({
      label,
      value: normalizePercent(rawVal),
    });
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
