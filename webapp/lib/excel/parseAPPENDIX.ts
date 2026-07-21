/**
 * parseAPPENDIX.ts – Parser cho Phụ lục báo cáo sự cố trạm
 * File Excel: PHỤ LỤC 1.xlsx
 *
 * Sheet: Báo Cáo Sự Cố Trạm
 * rows 4+ (r=3+): station(col2/c=1), duration(col4/c=3), cause(col5/c=4),
 *                 time(col3/c=2), fix(col7/c=6), status(col10/c=9)
 */

import {
  loadSheet,
  cellValue,
  cellText,
  txt,
  num,
  pct,
  whole,
  getSheetMaxRow,
  type Tone,
  type ReportBlock,
  type MetricItem,
  type ChartItem,
  type TableData,
} from './utils';

// ─── Kiểu dữ liệu nội bộ ─────────────────────────────────────────────────────

interface AppendixIncident {
  station: string;   // col2 – tên trạm
  time: string;      // col3 – thời gian xảy ra
  duration: string;  // col4 – thời gian mất liên lạc
  cause: string;     // col5 – nguyên nhân
  fix: string;       // col7 – biện pháp xử lý
  status: string;    // col10 – trạng thái
}

// ─── Hàm parse chính ─────────────────────────────────────────────────────────

export function parseAPPENDIX(buffer: Buffer): ReportBlock {
  const sheet = loadSheet(buffer, 'Báo Cáo Sự Cố Trạm');
  const maxRow = getSheetMaxRow(sheet);

  const incidents: AppendixIncident[] = [];

  for (let r = 3; r <= maxRow; r++) {
    // Python rows 4+ → r=3+
    const station = txt(cellValue(sheet, r, 1)); // col2
    if (!station) continue;

    incidents.push({
      station,
      time: cellText(sheet, r, 2),     // col3
      duration: cellText(sheet, r, 3), // col4
      cause: txt(cellValue(sheet, r, 4)),  // col5
      fix: txt(cellValue(sheet, r, 6)),    // col7
      status: txt(cellValue(sheet, r, 9)), // col10
    });
  }

  // ─── Thống kê theo nguyên nhân ────────────────────────────────────────────
  const causeCounts: Record<string, number> = {};
  for (const inc of incidents) {
    const causeKey = inc.cause || 'Không xác định';
    causeCounts[causeKey] = (causeCounts[causeKey] ?? 0) + 1;
  }

  // ─── Thống kê theo trạng thái ─────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const inc of incidents) {
    const statusKey = inc.status || 'Chưa cập nhật';
    statusCounts[statusKey] = (statusCounts[statusKey] ?? 0) + 1;
  }

  const resolvedCount = Object.entries(statusCounts)
    .filter(([k]) =>
      k.toLowerCase().includes('xong') ||
      k.toLowerCase().includes('hoàn') ||
      k.toLowerCase().includes('ok') ||
      k.toLowerCase().includes('đã')
    )
    .reduce((s, [, v]) => s + v, 0);

  const resolutionRate =
    incidents.length > 0 ? (resolvedCount / incidents.length) * 100 : null;

  const overallTone: Tone =
    incidents.length === 0
      ? 'positive'
      : (resolutionRate ?? 0) < 60
      ? 'critical'
      : (resolutionRate ?? 0) < 80
      ? 'warning'
      : 'positive';

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics: MetricItem[] = [
    {
      label: 'Tổng sự cố trạm',
      value: whole(incidents.length),
      tone: incidents.length > 20 ? 'critical' : incidents.length > 10 ? 'warning' : 'positive',
    },
    {
      label: 'Đã xử lý',
      value: whole(resolvedCount),
      tone: 'info',
    },
    {
      label: 'Tỉ lệ xử lý',
      value: pct(resolutionRate),
      tone: resolutionRate !== null
        ? resolutionRate < 60 ? 'critical' : resolutionRate < 80 ? 'warning' : 'positive'
        : 'info',
    },
    {
      label: 'Số nguyên nhân khác nhau',
      value: whole(Object.keys(causeCounts).length),
      tone: 'info',
    },
  ];

  // ─── Chart: Sự cố theo nguyên nhân ───────────────────────────────────────
  const chartItems: ChartItem[] = Object.entries(causeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cause, count]) => ({
      label: cause,
      value: count,
      display: whole(count),
      note: `${((count / incidents.length) * 100).toFixed(1)}%`,
      tone: count > 5 ? 'critical' : count > 2 ? 'warning' : 'info',
    }));

  // ─── Table: Danh sách sự cố ───────────────────────────────────────────────
  const table: TableData = {
    title: 'Danh sách sự cố trạm',
    columns: ['Trạm', 'Thời gian', 'Thời lượng', 'Nguyên nhân', 'Xử lý', 'Trạng thái'],
    rows: incidents.slice(0, 50).map((inc) => ({
      'Trạm': inc.station,
      'Thời gian': inc.time,
      'Thời lượng': inc.duration,
      'Nguyên nhân': inc.cause,
      'Xử lý': inc.fix,
      'Trạng thái': inc.status,
    })),
  };

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights: string[] = [];
  insights.push(
    `Tổng ${incidents.length} sự cố trạm, đã xử lý ${resolvedCount} (${pct(resolutionRate)})`
  );

  // Nguyên nhân phổ biến nhất
  const topCauses = Object.entries(causeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  for (const [cause, count] of topCauses) {
    insights.push(
      `Nguyên nhân "${cause}": ${count} trường hợp (${((count / incidents.length) * 100).toFixed(1)}%)`
    );
  }

  // Trạng thái phân bố
  for (const [status, count] of Object.entries(statusCounts)) {
    insights.push(`Trạng thái "${status}": ${count} trạm`);
  }

  return {
    id: 'appendix',
    group: 'operation',
    title: 'Phụ lục Sự cố Trạm',
    kicker: 'Báo Cáo Sự Cố Trạm',
    tone: overallTone,
    summary: `${incidents.length} sự cố trạm. Đã xử lý ${resolvedCount}/${incidents.length} (${pct(resolutionRate)}).`,
    metrics,
    insights,
    chart: {
      title: 'Sự cố theo nguyên nhân',
      items: chartItems,
    },
    table,
    list: {
      title: 'Trạng thái xử lý',
      items: Object.entries(statusCounts).map(
        ([status, count]) => `${status}: ${count} trạm`
      ),
    },
    raw: {
      incidents,
      causeCounts,
      statusCounts,
      resolvedCount,
      resolutionRate,
    },
  };
}
