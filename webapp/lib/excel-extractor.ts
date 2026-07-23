import * as xlsx from 'xlsx';

export function asNumber(value: any): number {
  if (value === null || value === undefined || value === "") return 0.0;
  if (typeof value === "number") return value;
  const text = String(value).replace(/%/g, "").replace(/,/g, "").trim();
  const parsed = parseFloat(text);
  return isNaN(parsed) ? 0.0 : parsed;
}

export function percent(value: any, decimals = 2, storedAsPercent = false): string {
  let number = asNumber(value);
  if (!storedAsPercent) {
    number *= 100;
  }
  return number.toFixed(decimals) + "%";
}

export function integer(value: any, dashZero = false): string {
  const number = Math.round(asNumber(value));
  if (dashZero && number === 0) return "-";
  return number.toLocaleString('en-US'); // Using commas for thousands
}

export function decimal(value: any, decimals = 2): string {
  return asNumber(value).toFixed(decimals);
}

export function evaluateTarget(value: any, target = 99.0): string {
  return asNumber(value) >= target ? "Đạt" : "Không đạt";
}

export function clean(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function rawMatrix(sheet: xlsx.WorkSheet, startRow: number, endRow: number, startCol: number, endCol: number): any[][] {
  const result: any[][] = [];
  for (let r = startRow; r <= endRow; r++) {
    const row: any[] = [];
    for (let c = startCol; c <= endCol; c++) {
      // xlsx uses 0-indexed columns (A=0, B=1) and rows (1-indexed in UI, but encode_cell takes 0-indexed row and col)
      const cellAddress = xlsx.utils.encode_cell({ r: r - 1, c: c - 1 });
      const cell = sheet[cellAddress];
      row.push(cell ? cell.v : null);
    }
    result.push(row);
  }
  return result;
}

export function worksheetMatrix(sheet: xlsx.WorkSheet, startRow: number, endRow: number, startCol: number, endCol: number): string[][] {
  const result: string[][] = [];
  for (let r = startRow; r <= endRow; r++) {
    const row: string[] = [];
    for (let c = startCol; c <= endCol; c++) {
      const cellAddress = xlsx.utils.encode_cell({ r: r - 1, c: c - 1 });
      const cell = sheet[cellAddress];
      let text = "";
      if (cell) {
        text = cell.w !== undefined ? cell.w : clean(cell.v);
      }
      row.push(text.trim());
    }
    result.push(row);
  }
  return result;
}
