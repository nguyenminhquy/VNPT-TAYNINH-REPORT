/** Định nghĩa 8 nguồn Excel của hệ thống */
export const REPORT_SOURCES = [
  {
    key: "mbb",
    label: "BÁO CÁO MBB",
    owner: "Hưng",
    filename: "1. BÁO CÁO MBB_HUNG.xlsx",
    tag: "MBB",
    color: "#005BAA",
  },
  {
    key: "fbb",
    label: "BÁO CÁO FBB",
    owner: "Bảo",
    filename: "2. BÁO CÁO FBB_BAO.xlsx",
    tag: "FBB",
    color: "#0078D4",
  },
  {
    key: "mytv",
    label: "BÁO CÁO MyTV",
    owner: "Tân",
    filename: "3. BÁO CÁO MYTV_TÂN.xlsx",
    tag: "MyTV",
    color: "#1E9BE9",
  },
  {
    key: "mll",
    label: "BÁO CÁO MLL",
    owner: "Khanh",
    filename: "4. BÁO CÁO MLL_KHANH.xlsx",
    tag: "MLL",
    color: "#F25022",
  },
  {
    key: "ispeed",
    label: "BÁO CÁO i-Speed",
    owner: "Quốc",
    filename: "5. BÁO CÁO ISPEED_QUOC.xlsx",
    tag: "i-Speed",
    color: "#7B83EB",
  },
  {
    key: "5s",
    label: "BÁO CÁO 5S NHÀ TRẠM",
    owner: "Tân",
    filename: "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx",
    tag: "5S",
    color: "#00B294",
  },
  {
    key: "xlsc",
    label: "BÁO CÁO XLSC",
    owner: "Tuấn",
    filename: "7.BÁO CÁO XLSC_TUẤN.xlsx",
    tag: "XLSC",
    color: "#FFB900",
  },
  {
    key: "appendix",
    label: "PHỤ LỤC 1",
    owner: "Phụ lục",
    filename: "PHỤ LỤC 1.xlsx",
    tag: "Phụ lục",
    color: "#737373",
  },
] as const;

export type ReportKey = (typeof REPORT_SOURCES)[number]["key"];

export const REPORT_MAP = Object.fromEntries(
  REPORT_SOURCES.map((s) => [s.key, s])
) as Record<ReportKey, (typeof REPORT_SOURCES)[number]>;
