/**
 * generateWord.ts – Tạo báo cáo Word từ dữ liệu dashboard cache JSON
 * Sử dụng thư viện `docx` (https://docx.js.org/)
 *
 * Cấu trúc tài liệu:
 *  1. Trang bìa (tiêu đề + ngày tạo)
 *  2. Bảng tóm tắt 6 signal bands
 *  3. Mỗi report block (8 blocks): heading, summary, metrics, chart, insights, table
 *  4. Danh sách hành động tuần
 */

import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
  WidthType,
  Packer,
  PageBreak,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx';

// ─── Kiểu dữ liệu (mirror từ lib/excel/utils.ts) ─────────────────────────────

interface MetricItem {
  label: string;
  value: string;
  tone: string;
}

interface ChartItem {
  label: string;
  value: number;
  display: string;
  note: string;
  tone: string;
}

interface ChartData {
  title: string;
  items: ChartItem[];
}

interface TableData {
  title: string;
  columns: string[];
  rows: Array<Record<string, string>>;
}

interface ListData {
  title: string;
  items: string[];
}

interface ReportBlock {
  id: string;
  group: string;
  title: string;
  kicker: string;
  tone: string;
  summary: string;
  metrics: MetricItem[];
  insights: string[];
  chart: ChartData;
  table: TableData;
  list: ListData;
  raw?: Record<string, unknown>;
}

interface ActionItem {
  title: string;
  detail: string;
}

interface DashboardData {
  reports?: ReportBlock[];
  generatedAt?: string;
  weekLabel?: string;
  actions?: ActionItem[];
  summary?: Record<string, string | number>;
  [key: string]: unknown;
}

// ─── Hằng số màu sắc & style ─────────────────────────────────────────────────

/** Màu xanh VNPT chủ đạo */
const COLOR_PRIMARY = '005BAA';
/** Màu header bảng */
const COLOR_TABLE_HEADER = 'D6E4F0';
/** Màu tone positive */
const COLOR_POSITIVE = '107C10';
/** Màu tone warning */
const COLOR_WARNING = 'FFB900';
/** Màu tone critical */
const COLOR_CRITICAL = 'D13438';
/** Font chính Times New Roman */
const FONT_MAIN = 'Times New Roman';

/** Map tone → màu hex */
function toneColor(tone: string): string {
  switch (tone) {
    case 'positive': return COLOR_POSITIVE;
    case 'warning':  return COLOR_WARNING;
    case 'critical': return COLOR_CRITICAL;
    default:         return '444444';
  }
}

// ─── Helpers tạo border mảnh ──────────────────────────────────────────────────

/** Border ô bảng mỏng màu xám */
const THIN_BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' },
  left:   { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' },
  right:  { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' },
};

/** Tạo ô bảng với text, optional shading */
function makeCell(
  text: string,
  options: {
    bold?: boolean;
    color?: string;
    shading?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    fontSize?: number;
    colSpan?: number;
    width?: number; // phần trăm
  } = {}
): TableCell {
  return new TableCell({
    columnSpan: options.colSpan,
    shading: options.shading
      ? { fill: options.shading, type: ShadingType.SOLID }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    width: options.width
      ? { size: options.width, type: WidthType.PERCENTAGE }
      : undefined,
    margins: {
      top: convertInchesToTwip(0.04),
      bottom: convertInchesToTwip(0.04),
      left: convertInchesToTwip(0.07),
      right: convertInchesToTwip(0.07),
    },
    borders: THIN_BORDER,
    children: [
      new Paragraph({
        alignment: options.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: options.bold ?? false,
            color: options.color ?? '000000',
            size: (options.fontSize ?? 12) * 2, // docx dùng half-points
            font: FONT_MAIN,
          }),
        ],
      }),
    ],
  });
}

// ─── Helpers tạo paragraph ────────────────────────────────────────────────────

/** Paragraph thông thường */
function makeParagraph(
  text: string,
  options: {
    bold?: boolean;
    color?: string;
    fontSize?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingBefore?: number;
    spacingAfter?: number;
  } = {}
): Paragraph {
  return new Paragraph({
    alignment: options.align ?? AlignmentType.LEFT,
    spacing: {
      before: options.spacingBefore ?? 80,
      after: options.spacingAfter ?? 80,
    },
    children: [
      new TextRun({
        text,
        bold: options.bold ?? false,
        color: options.color ?? '000000',
        size: (options.fontSize ?? 12) * 2,
        font: FONT_MAIN,
      }),
    ],
  });
}

/** Paragraph rỗng (khoảng cách) */
function spacer(size = 4): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '', size: size * 2, font: FONT_MAIN })],
    spacing: { before: 0, after: 0 },
  });
}

// ─── Section 1: Trang bìa ─────────────────────────────────────────────────────

function buildCoverSection(weekLabel: string, generatedAt: string): Paragraph[] {
  return [
    spacer(24),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'VNPT TÂY NINH',
          bold: true,
          size: 40, // 20pt
          color: COLOR_PRIMARY,
          font: FONT_MAIN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: 'BÁO CÁO TỔNG HỢP CÔNG VIỆC TUẦN',
          bold: true,
          size: 32, // 16pt
          color: COLOR_PRIMARY,
          font: FONT_MAIN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text: weekLabel || 'Báo cáo tuần',
          bold: true,
          size: 28, // 14pt
          color: '444444',
          font: FONT_MAIN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [
        new TextRun({
          text: `Ngày tạo: ${generatedAt}`,
          size: 24,
          color: '888888',
          font: FONT_MAIN,
        }),
      ],
    }),
    spacer(6),
    // Đường kẻ ngang
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
      },
      children: [],
    }),
    spacer(6),
  ];
}

// ─── Section 2: Bảng tóm tắt signal bands ────────────────────────────────────

/** Danh sách 6 signal bands hiển thị trong bảng tóm tắt */
const SIGNAL_BANDS = [
  { key: 'mbb',    label: 'MBB QoE'   },
  { key: 'fbb',    label: 'FBB QoS'   },
  { key: 'mytv',   label: 'MyTV QoE'  },
  { key: 'mll',    label: 'MLL'       },
  { key: 'ispeed', label: 'i-Speed'   },
  { key: '5s',     label: '5S'        },
];

function buildSummaryTable(
  reports: ReportBlock[],
  summary: Record<string, string | number> = {}
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Tiêu đề section
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'I. TÓM TẮT TỔNG QUAN',
          bold: true,
          size: 32,
          color: COLOR_PRIMARY,
          font: FONT_MAIN,
          allCaps: true,
        }),
      ],
    })
  );

  // Dòng header
  const headerCells = SIGNAL_BANDS.map(({ label }) =>
    makeCell(label, {
      bold: true,
      shading: COLOR_TABLE_HEADER,
      align: AlignmentType.CENTER,
      fontSize: 11,
      width: Math.floor(100 / SIGNAL_BANDS.length),
    })
  );

  // Tìm giá trị tóm tắt và tone cho từng band
  const getSignalInfo = (key: string): { value: string; tone: string } => {
    // Ưu tiên lấy từ summary object
    if (summary[key]) return { value: String(summary[key]), tone: 'info' };

    // Tìm trong reports theo id
    const block = reports.find((r) => r.id === key);
    if (block?.metrics && block.metrics.length > 0) {
      const first = block.metrics[0];
      return { value: first.value, tone: first.tone };
    }
    return { value: '—', tone: 'info' };
  };

  const valueCells = SIGNAL_BANDS.map(({ key }) => {
    const { value, tone } = getSignalInfo(key);
    return makeCell(value, {
      bold: true,
      color: toneColor(tone),
      align: AlignmentType.CENTER,
      fontSize: 12,
      width: Math.floor(100 / SIGNAL_BANDS.length),
    });
  });

  // Dòng tone (màu indicator)
  const toneCells = SIGNAL_BANDS.map(({ key }) => {
    const block = reports.find((r) => r.id === key);
    const tone = block?.tone ?? 'info';
    const label = tone === 'positive' ? '✔ Đạt'
                : tone === 'warning'  ? '⚠ Chú ý'
                : tone === 'critical' ? '✘ Cần xử lý'
                : '— N/A';
    return makeCell(label, {
      bold: false,
      color: toneColor(tone),
      align: AlignmentType.CENTER,
      fontSize: 10,
      width: Math.floor(100 / SIGNAL_BANDS.length),
    });
  });

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headerCells, tableHeader: true }),
      new TableRow({ children: valueCells }),
      new TableRow({ children: toneCells }),
    ],
  });

  elements.push(summaryTable);
  elements.push(spacer(6));

  return elements;
}

// ─── Section 3: Từng report block ────────────────────────────────────────────

/** Tạo bảng metrics (2 cột: Chỉ số | Giá trị) */
function buildMetricsTable(metrics: MetricItem[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell('Chỉ số', { bold: true, shading: COLOR_TABLE_HEADER, width: 60 }),
      makeCell('Giá trị', { bold: true, shading: COLOR_TABLE_HEADER, align: AlignmentType.CENTER, width: 40 }),
    ],
  });

  const dataRows = metrics.map(
    (m) =>
      new TableRow({
        children: [
          makeCell(m.label, { width: 60 }),
          makeCell(m.value, {
            bold: true,
            color: toneColor(m.tone),
            align: AlignmentType.CENTER,
            width: 40,
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

/** Tạo bảng chart items (Vùng/Trạm | Giá trị | Ghi chú) */
function buildChartTable(chart: ChartData): (Paragraph | Table)[] {
  if (!chart?.items || chart.items.length === 0) return [];

  const elements: (Paragraph | Table)[] = [];

  if (chart.title) {
    elements.push(
      makeParagraph(chart.title, { bold: true, fontSize: 11, color: '444444', spacingBefore: 100 })
    );
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell('Khu vực / Trạm', { bold: true, shading: COLOR_TABLE_HEADER, width: 45 }),
      makeCell('Giá trị', { bold: true, shading: COLOR_TABLE_HEADER, align: AlignmentType.CENTER, width: 25 }),
      makeCell('Ghi chú', { bold: true, shading: COLOR_TABLE_HEADER, width: 30 }),
    ],
  });

  const dataRows = chart.items.map(
    (item) =>
      new TableRow({
        children: [
          makeCell(item.label, { width: 45 }),
          makeCell(item.display || String(item.value), {
            bold: true,
            color: toneColor(item.tone),
            align: AlignmentType.CENTER,
            width: 25,
          }),
          makeCell(item.note || '', { fontSize: 10, color: '666666', width: 30 }),
        ],
      })
  );

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    })
  );

  return elements;
}

/** Tạo bảng data table tổng quát (nhiều cột) */
function buildDataTable(table: TableData): (Paragraph | Table)[] {
  if (!table?.columns || table.columns.length === 0) return [];
  if (!table?.rows || table.rows.length === 0) return [];

  const elements: (Paragraph | Table)[] = [];

  if (table.title) {
    elements.push(
      makeParagraph(table.title, { bold: true, fontSize: 11, color: '444444', spacingBefore: 100 })
    );
  }

  const colCount = table.columns.length;
  const colWidth = Math.floor(100 / colCount);

  const headerRow = new TableRow({
    tableHeader: true,
    children: table.columns.map((col) =>
      makeCell(col, { bold: true, shading: COLOR_TABLE_HEADER, width: colWidth })
    ),
  });

  const dataRows = table.rows.map(
    (row) =>
      new TableRow({
        children: table.columns.map((col) =>
          makeCell(row[col] ?? '', { width: colWidth, fontSize: 11 })
        ),
      })
  );

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    })
  );

  return elements;
}

/** Build toàn bộ nội dung cho 1 report block */
function buildReportBlock(
  block: ReportBlock,
  index: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // ── Heading ──────────────────────────────────────────────────────────────────
  const headingNumber = `${index}.`;
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 100 },
      children: [
        new TextRun({
          text: `${headingNumber} ${block.title}`,
          bold: true,
          size: 28, // 14pt
          color: COLOR_PRIMARY,
          font: FONT_MAIN,
        }),
        ...(block.kicker
          ? [
              new TextRun({
                text: `  — ${block.kicker}`,
                bold: false,
                size: 22,
                color: '888888',
                font: FONT_MAIN,
              }),
            ]
          : []),
      ],
    })
  );

  // ── Nhãn tone ────────────────────────────────────────────────────────────────
  if (block.tone && block.tone !== 'info') {
    const toneLabel =
      block.tone === 'positive' ? '✔ Tình trạng tốt'
      : block.tone === 'warning' ? '⚠ Cần chú ý'
      : '✘ Cần xử lý khẩn';
    elements.push(
      makeParagraph(toneLabel, {
        bold: true,
        color: toneColor(block.tone),
        fontSize: 11,
        spacingBefore: 40,
        spacingAfter: 60,
      })
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  if (block.summary) {
    elements.push(
      makeParagraph(block.summary, {
        fontSize: 12,
        color: '222222',
        spacingBefore: 60,
        spacingAfter: 100,
      })
    );
  }

  // ── Metrics table ────────────────────────────────────────────────────────────
  if (block.metrics && block.metrics.length > 0) {
    elements.push(
      makeParagraph('Các chỉ số chính:', { bold: true, fontSize: 11, color: '444444' })
    );
    elements.push(buildMetricsTable(block.metrics));
    elements.push(spacer(4));
  }

  // ── Chart items table ────────────────────────────────────────────────────────
  const chartElements = buildChartTable(block.chart);
  elements.push(...chartElements);
  if (chartElements.length > 0) elements.push(spacer(4));

  // ── Insights ─────────────────────────────────────────────────────────────────
  if (block.insights && block.insights.length > 0) {
    elements.push(
      makeParagraph('Nhận xét & phân tích:', { bold: true, fontSize: 11, color: '444444', spacingBefore: 80 })
    );
    block.insights.forEach((insight, i) => {
      elements.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `${i + 1}. ${insight}`,
              size: 24,
              font: FONT_MAIN,
              color: '333333',
            }),
          ],
        })
      );
    });
    elements.push(spacer(4));
  }

  // ── Data table ───────────────────────────────────────────────────────────────
  const tableElements = buildDataTable(block.table);
  elements.push(...tableElements);
  if (tableElements.length > 0) elements.push(spacer(4));

  // ── List data ────────────────────────────────────────────────────────────────
  if (block.list?.items && block.list.items.length > 0) {
    if (block.list.title) {
      elements.push(
        makeParagraph(block.list.title, { bold: true, fontSize: 11, color: '444444', spacingBefore: 80 })
      );
    }
    block.list.items.forEach((item, i) => {
      elements.push(
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text: `  • ${item}`,
              size: 24,
              font: FONT_MAIN,
              color: '333333',
            }),
          ],
        })
      );
    });
  }

  return elements;
}

// ─── Section 4: Hành động tuần ───────────────────────────────────────────────

function buildActionsSection(actions: ActionItem[]): (Paragraph | Table)[] {
  if (!actions || actions.length === 0) return [];

  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 160 },
      children: [
        new TextRun({
          text: `IV. CÁC HÀNH ĐỘNG TUẦN TỚI`,
          bold: true,
          size: 32,
          color: COLOR_PRIMARY,
          font: FONT_MAIN,
          allCaps: true,
        }),
      ],
    })
  );

  actions.forEach((action, idx) => {
    elements.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({
            text: `${idx + 1}. ${action.title}`,
            bold: true,
            size: 26,
            font: FONT_MAIN,
            color: '003A6E',
          }),
        ],
      })
    );

    if (action.detail) {
      elements.push(
        new Paragraph({
          spacing: { before: 20, after: 80 },
          children: [
            new TextRun({
              text: `   ${action.detail}`,
              size: 24,
              font: FONT_MAIN,
              color: '555555',
            }),
          ],
        })
      );
    }
  });

  return elements;
}

// ─── Hàm export chính ────────────────────────────────────────────────────────

/**
 * Tạo file Word từ dữ liệu dashboard cache JSON.
 * @param dashboardData - Dữ liệu đã parse từ cache (report_data_cache.data)
 * @returns Buffer chứa file .docx
 */
export async function generateWordReport(
  dashboardData: Record<string, unknown>
): Promise<Buffer> {
  const data = dashboardData as DashboardData;

  // ── Dữ liệu cơ bản ───────────────────────────────────────────────────────────
  const reports: ReportBlock[] = Array.isArray(data.reports) ? data.reports : [];
  const actions: ActionItem[] = Array.isArray(data.actions) ? data.actions : [];
  const summary = (data.summary as Record<string, string | number>) ?? {};

  // Định dạng ngày tạo theo múi giờ Việt Nam
  const now = new Date();
  const generatedAt = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const weekLabel =
    typeof data.weekLabel === 'string'
      ? data.weekLabel
      : `Tuần ${now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

  // ── Xây dựng nội dung ────────────────────────────────────────────────────────
  const children: (Paragraph | Table)[] = [];

  // Trang bìa
  children.push(...buildCoverSection(weekLabel, generatedAt));

  // Ngắt trang trước phần tóm tắt
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Bảng tóm tắt
  children.push(...buildSummaryTable(reports, summary));

  // Separator
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 120 },
      children: [
        new TextRun({
          text: 'II. CHI TIẾT TỪNG BÁO CÁO',
          bold: true,
          size: 32,
          color: COLOR_PRIMARY,
          font: FONT_MAIN,
          allCaps: true,
        }),
      ],
    })
  );

  // Từng report block
  reports.forEach((block, idx) => {
    // Ngắt trang sau mỗi report (trừ report đầu tiên)
    if (idx > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(...buildReportBlock(block, idx + 1));
  });

  // Danh sách hành động
  const actionElements = buildActionsSection(actions);
  children.push(...actionElements);

  // Chân trang
  children.push(spacer(8));
  children.push(
    new Paragraph({
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      },
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: `VNPT Tây Ninh  •  ${generatedAt}  •  Tài liệu nội bộ`,
          size: 18,
          color: 'AAAAAA',
          font: FONT_MAIN,
        }),
      ],
    })
  );

  // ── Tạo Document ─────────────────────────────────────────────────────────────
  const doc = new Document({
    title: 'BÁO CÁO TỔNG HỢP TUẦN VNPT TÂY NINH',
    subject: weekLabel,
    creator: 'VNPT Report Hub',
    description: 'Báo cáo tổng hợp công việc tuần — tự động tạo bởi hệ thống',
    styles: {
      default: {
        document: {
          run: {
            font: FONT_MAIN,
            size: 24, // 12pt
          },
        },
        heading1: {
          run: {
            font: FONT_MAIN,
            size: 32, // 16pt
            bold: true,
            color: COLOR_PRIMARY,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        heading2: {
          run: {
            font: FONT_MAIN,
            size: 28, // 14pt
            bold: true,
            color: COLOR_PRIMARY,
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    1440, // 1 inch
              right:  1080, // 0.75 inch
              bottom: 1440,
              left:   1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Đóng gói thành Buffer
  return Packer.toBuffer(doc);
}
