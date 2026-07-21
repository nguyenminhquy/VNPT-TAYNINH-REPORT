/**
 * parse5S.ts – Parser cho báo cáo 5S Nhà Trạm
 * File Excel: 6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx
 *
 * Sheet: Sheet1
 * 4 nhóm kiểm tra, mỗi nhóm có:
 *   - Dòng dữ liệu theo team: team(col2), total(col3), done(col4), pending(col5), ratio%(col6)
 *   - Python cols = 1-indexed, SheetJS 0-indexed → col2=c=1, col3=c=2, col4=c=3, col5=c=4, col6=c=5
 *
 * Nhóm 1 – Nhà trạm (house):   rows 3-9 (r=2..8), total row 10 (r=9)
 * Nhóm 2 – AC (ac):            rows 16-22 (r=15..21), total row 23 (r=22)
 * Nhóm 3 – AP (ap):            rows 28-34 (r=27..33), total row 35 (r=34)
 * Nhóm 4 – Khảo sát (survey):  rows 40-46 (r=39..45), total row 47 (r=46)
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

interface S5TeamRow {
  team: string;
  total: number | null;
  done: number | null;
  pending: number | null;
  ratio: number | null; // %
}

interface S5Group {
  name: string;
  rows: S5TeamRow[];
  totalRow: S5TeamRow | null;
}

// ─── Helper: đọc nhóm ────────────────────────────────────────────────────────

function parseGroup(
  sheet: ReturnType<typeof loadSheet>,
  groupName: string,
  dataStartRow: number, // 0-indexed
  dataEndRow: number,   // 0-indexed inclusive
  totalRowIndex: number // 0-indexed
): S5Group {
  const rows: S5TeamRow[] = [];

  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const team = txt(cellValue(sheet, r, 1)); // col2 → c=1
    if (!team) continue;
    rows.push({
      team,
      total: num(cellValue(sheet, r, 2)),                      // col3
      done: num(cellValue(sheet, r, 3)),                       // col4
      pending: num(cellValue(sheet, r, 4)),                    // col5
      ratio: normalizePercent(cellValue(sheet, r, 5)),         // col6
    });
  }

  const totalTeam = txt(cellValue(sheet, totalRowIndex, 1));
  const totalRow: S5TeamRow | null = {
    team: totalTeam || 'Tổng',
    total: num(cellValue(sheet, totalRowIndex, 2)),
    done: num(cellValue(sheet, totalRowIndex, 3)),
    pending: num(cellValue(sheet, totalRowIndex, 4)),
    ratio: normalizePercent(cellValue(sheet, totalRowIndex, 5)),
  };

  return { name: groupName, rows, totalRow };
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parse5S(buffer: Buffer): ReportBlock {
  const sheet = loadSheet(buffer, 'Sheet1');

  // Nhóm 1: Nhà trạm – rows 3-9, total row 10
  // Python rows 3-9 → r=2..8; total row 10 → r=9
  const houseGroup = parseGroup(sheet, 'Nhà trạm', 2, 8, 9);

  // Nhóm 2: AC – rows 16-22, total row 23
  // Python rows 16-22 → r=15..21; total row 23 → r=22
  const acGroup = parseGroup(sheet, 'AC', 15, 21, 22);

  // Nhóm 3: AP – rows 28-34, total row 35
  // Python rows 28-34 → r=27..33; total row 35 → r=34
  const apGroup = parseGroup(sheet, 'AP', 27, 33, 34);

  // Nhóm 4: Khảo sát – rows 40-46, total row 47
  // Python rows 40-46 → r=39..45; total row 47 → r=46
  const surveyGroup = parseGroup(sheet, 'Khảo sát', 39, 45, 46);

  const allGroups: S5Group[] = [houseGroup, acGroup, apGroup, surveyGroup];

  // ─── Tính toán tổng hợp ───────────────────────────────────────────────────
  const avgRatio =
    allGroups.reduce((s, g) => s + (g.totalRow?.ratio ?? 0), 0) /
    allGroups.filter((g) => g.totalRow?.ratio !== null).length;

  const overallTone: Tone =
    avgRatio < 70
      ? 'critical'
      : avgRatio < 85
      ? 'warning'
      : 'positive';

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics: MetricItem[] = allGroups.map((g) => ({
    label: `Tỉ lệ hoàn thành ${g.name}`,
    value: pct(g.totalRow?.ratio ?? null),
    tone: toneFromRatio(g.totalRow?.ratio ?? 0, 85, 70),
  }));

  // Thêm metrics tổng
  metrics.push({
    label: 'Tổng việc đã làm',
    value: whole(
      allGroups.reduce((s, g) => s + (g.totalRow?.done ?? 0), 0)
    ),
    tone: 'info',
  });
  metrics.push({
    label: 'Tổng việc còn tồn',
    value: whole(
      allGroups.reduce((s, g) => s + (g.totalRow?.pending ?? 0), 0)
    ),
    tone: 'warning',
  });

  // ─── Chart: Tỉ lệ theo team trong nhóm nhà trạm ──────────────────────────
  const chartItems: ChartItem[] = houseGroup.rows.map((row) => ({
    label: row.team,
    value: row.ratio ?? 0,
    display: pct(row.ratio),
    note: `Xong: ${whole(row.done)}, Còn: ${whole(row.pending)}`,
    tone: toneFromRatio(row.ratio ?? 0, 85, 70),
  }));

  // ─── Table: Tất cả nhóm ───────────────────────────────────────────────────
  const allRows: Array<Record<string, string>> = [];
  for (const group of allGroups) {
    for (const row of group.rows) {
      allRows.push({
        'Nhóm': group.name,
        'Team': row.team,
        'Tổng': whole(row.total),
        'Xong': whole(row.done),
        'Còn': whole(row.pending),
        'Tỉ lệ': pct(row.ratio),
      });
    }
    if (group.totalRow) {
      allRows.push({
        'Nhóm': `[Tổng ${group.name}]`,
        'Team': group.totalRow.team,
        'Tổng': whole(group.totalRow.total),
        'Xong': whole(group.totalRow.done),
        'Còn': whole(group.totalRow.pending),
        'Tỉ lệ': pct(group.totalRow.ratio),
      });
    }
  }

  const table: TableData = {
    title: 'Chi tiết 5S theo nhóm và team',
    columns: ['Nhóm', 'Team', 'Tổng', 'Xong', 'Còn', 'Tỉ lệ'],
    rows: allRows,
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  insights.push(
    `Tỉ lệ hoàn thành trung bình các nhóm 5S: ${avgRatio.toFixed(2)}%`
  );

  for (const group of allGroups) {
    if (group.totalRow) {
      insights.push(
        `${group.name}: ${whole(group.totalRow.done)}/${whole(group.totalRow.total)} (${pct(group.totalRow.ratio)})`
      );
    }
  }

  const minGroup = allGroups.reduce<S5Group | null>(
    (min, g) =>
      g.totalRow?.ratio !== null &&
      (min === null ||
        (g.totalRow?.ratio ?? 0) < (min.totalRow?.ratio ?? 100))
        ? g
        : min,
    null
  );
  if (minGroup)
    insights.push(
      `Nhóm tỉ lệ thấp nhất: ${minGroup.name} (${pct(minGroup.totalRow?.ratio ?? null)})`
    );

  return {
    id: '5s',
    group: 'operation',
    title: 'Báo cáo 5S Nhà Trạm',
    kicker: '5S Nhà Trạm',
    tone: overallTone,
    summary: `Tỉ lệ hoàn thành TB: ${avgRatio.toFixed(2)}%. Nhà trạm ${pct(houseGroup.totalRow?.ratio ?? null)}, AC ${pct(acGroup.totalRow?.ratio ?? null)}, AP ${pct(apGroup.totalRow?.ratio ?? null)}.`,
    metrics,
    insights,
    chart: {
      title: 'Tỉ lệ 5S Nhà Trạm theo team',
      items: chartItems,
    },
    table,
    list: {
      title: 'Tổng hợp 4 nhóm',
      items: allGroups.map(
        (g) =>
          `${g.name}: Xong ${whole(g.totalRow?.done ?? null)}/${whole(g.totalRow?.total ?? null)} (${pct(g.totalRow?.ratio ?? null)})`
      ),
    },
    raw: {
      houseGroup,
      acGroup,
      apGroup,
      surveyGroup,
      avgRatio,
    },
  };
}
