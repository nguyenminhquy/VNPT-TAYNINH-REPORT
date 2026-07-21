/**
 * parseISPEED.ts – Parser cho báo cáo iSpeed
 * File Excel: 5. BÁO CÁO ISPEED_QUOC.xlsx
 *
 * Sheets được parse:
 * - Báo cáo: kết quả iSpeed/Speedtest theo team và tổng
 * - SUM: tốc độ download thực đo theo team
 *
 * Chi tiết sheet "Báo cáo":
 * - rows 2-8 (r=1..7): team(col2/c=1), ispeedRatio%(col6/c=5), speedtestRatio%(col9/c=8), ratio5g%(col11/c=10)
 * - row9 (r=8): totals: col5/c=4=ispeedDone, col4/c=3=ispeedGoal, col8/c=7=speedtestDone,
 *               col7/c=6=speedtestGoal, col10/c=9=total5g, col11/c=10=ratio5g%
 * - row12 (r=11), col2 (c=1): dateRange text
 *
 * Chi tiết sheet "SUM":
 * - rows 5+ (r=4+): team(col2/c=1), ispeedDownload(col8/c=7), speedtestDownload(col10/c=9)
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

interface ISpeedTeamRow {
  team: string;
  ispeedRatio: number | null;       // %
  speedtestRatio: number | null;    // %
  ratio5g: number | null;           // %
}

interface ISpeedTotals {
  ispeedDone: number | null;
  ispeedGoal: number | null;
  speedtestDone: number | null;
  speedtestGoal: number | null;
  total5g: number | null;
  ratio5g: number | null;
}

interface ISpeedSumRow {
  team: string;
  ispeedDownload: number | null;
  speedtestDownload: number | null;
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseISPEED(buffer: Buffer): ReportBlock {
  const sheets = loadSheets(buffer, ['Báo cáo', 'SUM']);

  // ── Sheet 1: Báo cáo ──────────────────────────────────────────────────────
  const sheetBC = sheets['Báo cáo'];

  // rows 2-8 → r=1..7
  const teamRows: ISpeedTeamRow[] = [];
  for (let r = 1; r <= 7; r++) {
    const team = txt(cellValue(sheetBC, r, 1)); // col2
    if (!team) continue;
    teamRows.push({
      team,
      ispeedRatio: normalizePercent(cellValue(sheetBC, r, 5)),    // col6
      speedtestRatio: normalizePercent(cellValue(sheetBC, r, 8)), // col9
      ratio5g: normalizePercent(cellValue(sheetBC, r, 10)),       // col11
    });
  }

  // row9 totals → r=8
  const totals: ISpeedTotals = {
    ispeedGoal: num(cellValue(sheetBC, 8, 3)),          // col4
    ispeedDone: num(cellValue(sheetBC, 8, 4)),          // col5
    speedtestGoal: num(cellValue(sheetBC, 8, 6)),       // col7
    speedtestDone: num(cellValue(sheetBC, 8, 7)),       // col8
    total5g: num(cellValue(sheetBC, 8, 9)),             // col10
    ratio5g: normalizePercent(cellValue(sheetBC, 8, 10)), // col11
  };

  // row12,col2 → r=11, c=1
  const dateRange = txt(cellValue(sheetBC, 11, 1));

  // ── Sheet 2: SUM (rows 5+ → r=4+) ────────────────────────────────────────
  const sheetSUM = sheets['SUM'];
  const maxRowSUM = getSheetMaxRow(sheetSUM);
  const sumRows: ISpeedSumRow[] = [];

  for (let r = 4; r <= maxRowSUM; r++) {
    const team = txt(cellValue(sheetSUM, r, 1)); // col2
    if (!team) continue;
    sumRows.push({
      team,
      ispeedDownload: num(cellValue(sheetSUM, r, 7)),    // col8
      speedtestDownload: num(cellValue(sheetSUM, r, 9)), // col10
    });
  }

  // ─── Tính toán ────────────────────────────────────────────────────────────
  // Tỉ lệ hoàn thành iSpeed tổng
  const ispeedCompletionRatio =
    totals.ispeedGoal && totals.ispeedGoal > 0
      ? ((totals.ispeedDone ?? 0) / totals.ispeedGoal) * 100
      : null;

  const speedtestCompletionRatio =
    totals.speedtestGoal && totals.speedtestGoal > 0
      ? ((totals.speedtestDone ?? 0) / totals.speedtestGoal) * 100
      : null;

  const overallTone: Tone =
    (ispeedCompletionRatio ?? 0) < 70
      ? 'critical'
      : (ispeedCompletionRatio ?? 0) < 85
      ? 'warning'
      : 'positive';

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics: MetricItem[] = [
    {
      label: 'iSpeed hoàn thành',
      value: `${whole(totals.ispeedDone)} / ${whole(totals.ispeedGoal)}`,
      tone: toneFromRatio(ispeedCompletionRatio ?? 0, 85, 70),
    },
    {
      label: 'Tỉ lệ iSpeed',
      value: pct(ispeedCompletionRatio),
      tone: toneFromRatio(ispeedCompletionRatio ?? 0, 85, 70),
    },
    {
      label: 'Speedtest hoàn thành',
      value: `${whole(totals.speedtestDone)} / ${whole(totals.speedtestGoal)}`,
      tone: toneFromRatio(speedtestCompletionRatio ?? 0, 85, 70),
    },
    {
      label: 'Tỉ lệ Speedtest',
      value: pct(speedtestCompletionRatio),
      tone: toneFromRatio(speedtestCompletionRatio ?? 0, 85, 70),
    },
    {
      label: 'Tỉ lệ 5G',
      value: pct(totals.ratio5g),
      tone: 'info',
    },
    {
      label: 'Kỳ báo cáo',
      value: dateRange || 'N/A',
      tone: 'info',
    },
  ];

  // ─── Chart: iSpeed ratio từng team ───────────────────────────────────────
  const chartItems: ChartItem[] = teamRows.map((row) => ({
    label: row.team,
    value: row.ispeedRatio ?? 0,
    display: pct(row.ispeedRatio),
    note: `Speedtest: ${pct(row.speedtestRatio)}, 5G: ${pct(row.ratio5g)}`,
    tone: toneFromRatio(row.ispeedRatio ?? 0, 85, 70),
  }));

  // ─── Table: Download theo team (SUM sheet) ────────────────────────────────
  const table: TableData = {
    title: 'Tốc độ download thực đo theo team',
    columns: ['Team', 'iSpeed DL (Mbps)', 'Speedtest DL (Mbps)'],
    rows: sumRows.map((r) => ({
      'Team': r.team,
      'iSpeed DL (Mbps)': r.ispeedDownload !== null ? r.ispeedDownload.toFixed(2) : 'N/A',
      'Speedtest DL (Mbps)': r.speedtestDownload !== null ? r.speedtestDownload.toFixed(2) : 'N/A',
    })),
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (dateRange)
    insights.push(`Kỳ đo: ${dateRange}`);
  if (ispeedCompletionRatio !== null)
    insights.push(
      `Hoàn thành iSpeed: ${whole(totals.ispeedDone)}/${whole(totals.ispeedGoal)} (${pct(ispeedCompletionRatio)})`
    );
  if (speedtestCompletionRatio !== null)
    insights.push(
      `Hoàn thành Speedtest: ${whole(totals.speedtestDone)}/${whole(totals.speedtestGoal)} (${pct(speedtestCompletionRatio)})`
    );

  const minTeam = teamRows.reduce<ISpeedTeamRow | null>(
    (min, r) =>
      r.ispeedRatio !== null &&
      (min === null || (r.ispeedRatio ?? 0) < (min.ispeedRatio ?? 100))
        ? r
        : min,
    null
  );
  if (minTeam && minTeam.ispeedRatio !== null)
    insights.push(
      `Team iSpeed thấp nhất: ${minTeam.team} (${pct(minTeam.ispeedRatio)})`
    );

  if (totals.ratio5g !== null)
    insights.push(`Tỉ lệ 5G: ${pct(totals.ratio5g)}`);

  return {
    id: 'ispeed',
    group: 'operation',
    title: 'Báo cáo iSpeed',
    kicker: 'Đo kiểm tốc độ mạng',
    tone: overallTone,
    summary: `iSpeed ${pct(ispeedCompletionRatio)}, Speedtest ${pct(speedtestCompletionRatio)}, 5G ${pct(totals.ratio5g)}.`,
    metrics,
    insights,
    chart: {
      title: 'Tỉ lệ hoàn thành iSpeed theo team',
      items: chartItems,
    },
    table,
    list: {
      title: 'Chi tiết team',
      items: teamRows.map(
        (r) =>
          `${r.team}: iSpeed ${pct(r.ispeedRatio)}, Speedtest ${pct(r.speedtestRatio)}, 5G ${pct(r.ratio5g)}`
      ),
    },
    raw: {
      teamRows,
      totals,
      dateRange,
      sumRows,
      ispeedCompletionRatio,
      speedtestCompletionRatio,
    },
  };
}
