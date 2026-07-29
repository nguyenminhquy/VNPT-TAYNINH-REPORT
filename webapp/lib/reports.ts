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
    owner: "Lê Ngọc Hân",
    filename: "8.PHỤ LỤC 1_HÂN.xlsx",
    tag: "Phụ lục",
    color: "#737373",
  },
] as const;

export const MONTHLY_REPORT_SOURCES = [
  ...REPORT_SOURCES,
  {
    key: "omc_tam",
    label: "HIỆN TRẠNG THIẾT BỊ",
    owner: "Tâm",
    filename: "9.HIỆN TRẠNG THIẾT BỊ_TÂM.xlsx",
    tag: "Thiết bị",
    color: "#8B5CF6",
  },
  {
    key: "omc_nhi",
    label: "BÁO CÁO BSC",
    owner: "Nhi",
    filename: "10. BÁO CÁO BSC_NHI.xlsx",
    tag: "BSC",
    color: "#EC4899",
  },
] as const;

export type ReportKey = (typeof MONTHLY_REPORT_SOURCES)[number]["key"];

export const REPORT_MAP = Object.fromEntries(
  MONTHLY_REPORT_SOURCES.map((s) => [s.key, s])
) as Record<ReportKey, (typeof MONTHLY_REPORT_SOURCES)[number]>;
