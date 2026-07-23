/**
 * utils.ts – Các hàm tiện ích dùng chung cho tất cả Excel parsers
 * Dùng với thư viện SheetJS (xlsx npm package)
 */

import * as XLSX from 'xlsx';
import type { WorkSheet } from 'xlsx';

// ─── Re-export WorkSheet type cho các parsers khác dùng ───────────────────────
export type { WorkSheet };

// ─── Số học ──────────────────────────────────────────────────────────────────

/**
 * Chuyển giá trị bất kỳ sang number. Trả null nếu không hợp lệ.
 */
export function num(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/**
 * Định dạng số thành chuỗi phần trăm, ví dụ: 95.23 → "95.23%"
 * Tự động nhân 100 nếu giá trị <= 1 (Excel lưu % dạng thập phân 0.xx)
 */
export function pct(val: number | null, digits = 2): string {
  if (val === null) return 'N/A';
  const v = Math.abs(val) <= 1 ? val * 100 : val;
  return `${v.toFixed(digits)}%`;
}

/**
 * Định dạng số nguyên thành chuỗi, dùng dấu phẩy phân tách hàng nghìn
 */
export function whole(val: number | null): string {
  if (val === null) return 'N/A';
  return Math.round(val).toLocaleString('vi-VN');
}

/**
 * Chuyển giá trị bất kỳ thành string, trim khoảng trắng
 */
export function txt(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

// ─── Tone / Màu sắc ──────────────────────────────────────────────────────────

export type Tone = 'positive' | 'warning' | 'critical' | 'info';

/**
 * Xác định tone từ điểm số (cao là tốt).
 * val >= warning → positive, val >= critical → warning, còn lại → critical
 */
export function toneFromScore(
  val: number,
  warning: number,
  critical: number
): Tone {
  if (val >= warning) return 'positive';
  if (val >= critical) return 'warning';
  return 'critical';
}

/**
 * Xác định tone từ tỉ lệ % (cao là tốt).
 * Tự động nhân 100 nếu val <= 1 (dạng thập phân).
 */
export function toneFromRatio(
  val: number,
  warning: number,
  critical: number
): Tone {
  const v = Math.abs(val) <= 1 ? val * 100 : val;
  return toneFromScore(v, warning, critical);
}

// ─── SheetJS helpers ──────────────────────────────────────────────────────────

/**
 * Đọc giá trị ô tại row, col (đều 0-indexed).
 * Trả undefined nếu ô không tồn tại.
 */
export function cellValue(
  sheet: WorkSheet,
  row: number,
  col: number
): unknown {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[addr];
  if (!cell) return undefined;
  return cell.v;
}

/**
 * Đọc giá trị ô dạng text (bao gồm formatted text nếu có).
 */
export function cellText(
  sheet: WorkSheet,
  row: number,
  col: number
): string {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[addr];
  if (!cell) return '';
  return txt(cell.w ?? cell.v);
}

/**
 * Load một sheet từ buffer. Throw Error nếu không tìm thấy sheet.
 */
export function loadSheet(
  workbookBuffer: Buffer,
  sheetName: string
): WorkSheet {
  const wb = XLSX.read(workbookBuffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    const available = wb.SheetNames.join(', ');
    throw new Error(
      `Sheet "${sheetName}" không tồn tại. Các sheet có sẵn: [${available}]`
    );
  }
  return sheet;
}

/**
 * Load nhiều sheet cùng lúc từ một buffer.
 */
export function loadSheets(
  workbookBuffer: Buffer,
  sheetNames: string[]
): Record<string, WorkSheet> {
  const wb = XLSX.read(workbookBuffer, { type: 'buffer', cellDates: true });
  const result: Record<string, WorkSheet> = {};
  for (const name of sheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) {
      const available = wb.SheetNames.join(', ');
      throw new Error(
        `Sheet "${name}" không tồn tại. Các sheet có sẵn: [${available}]`
      );
    }
    result[name] = sheet;
  }
  return result;
}

export function getSheetMaxRow(sheet: WorkSheet): number {
  let max = -1;
  for (const key in sheet) {
    if (Object.prototype.hasOwnProperty.call(sheet, key) && !key.startsWith('!')) {
      const decoded = XLSX.utils.decode_cell(key);
      if (decoded.r > max) max = decoded.r;
    }
  }
  if (max === -1 && sheet['!ref']) {
    return XLSX.utils.decode_range(sheet['!ref']).e.r;
  }
  return max;
}

/**
 * Đọc một hàng thành mảng giá trị.
 * @param sheet - WorkSheet
 * @param row - Số hàng (0-indexed)
 * @param fromCol - Cột bắt đầu (0-indexed)
 * @param toCol - Cột kết thúc (0-indexed, inclusive)
 */
export function readRow(
  sheet: WorkSheet,
  row: number,
  fromCol: number,
  toCol: number
): unknown[] {
  const values: unknown[] = [];
  for (let c = fromCol; c <= toCol; c++) {
    values.push(cellValue(sheet, row, c));
  }
  return values;
}

/**
 * Chuẩn hoá giá trị % từ Excel:
 * - Nếu Excel lưu dạng thập phân (<=1) → nhân 100
 * - Nếu đã là dạng phần trăm (>1) → giữ nguyên
 */
export function normalizePercent(val: unknown): number | null {
  const n = num(val);
  if (n === null) return null;
  return Math.abs(n) <= 1.5 ? n * 100 : n;
}

// ─── Kiểu dữ liệu output chung ───────────────────────────────────────────────

export interface MetricItem {
  label: string;
  value: string;
  tone: Tone;
}

export interface ChartItem {
  label: string;
  value: number;
  display: string;
  note: string;
  tone: Tone;
}

export interface ChartData {
  title: string;
  items: ChartItem[];
}

export interface TableData {
  title: string;
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface ListData {
  title: string;
  items: string[];
}

export interface ReportBlock {
  id: string;
  group: 'service' | 'operation';
  title: string;
  kicker: string;
  tone: Tone;
  summary: string;
  metrics: MetricItem[];
  insights: string[];
  chart: ChartData;
  table: TableData;
  list: ListData;
  raw?: Record<string, unknown>;
}
