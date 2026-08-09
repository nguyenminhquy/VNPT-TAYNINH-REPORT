"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { REPORT_SOURCES, MONTHLY_REPORT_SOURCES, WEEKLY_MLL_SOURCES, type ReportKey } from "@/lib/reports";
import Link from 'next/link';
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from 'react-hot-toast';
import { upload } from '@vercel/blob/client';
import ShiftHandover from "@/components/ShiftHandover";
import InspectionLog from "@/components/InspectionLog";
import GeneratorLog from "@/components/GeneratorLog";
import WeeklySchedule from "@/components/WeeklySchedule";
import Special5Report from "@/components/Special5Report";
import "./dashboard.css";
import VnptLogo from "@/components/VnptLogo";
import Footer from "@/components/Footer";

const PETITION_TEMPLATES = [
  { id: '01_Mau_Bao_cao', name: 'Mẫu Báo cáo' },
  { id: '02_Mau_To_trinh', name: 'Mẫu Tờ trình' },
  { id: '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len', name: 'Mẫu Công văn gửi từ 2 đơn vị trở lên' },
  { id: '03b_Mau_Cong_van_gui_1_don_vi', name: 'Mẫu Công văn gửi 1 đơn vị' },
  { id: '04_Mau_Thong_bao', name: 'Mẫu Thông báo' },
  { id: '05_Mau_Quyet_dinh_quy_dinh_truc_tiep', name: 'Mẫu Quyết định quy định trực tiếp' },
  { id: '06_Mau_Quyet_dinh_ban_hanh_quy_che_quy_dinh', name: 'Mẫu Quyết định ban hành quy chế, quy định' },
  { id: '07_Mau_Van_ban_khac_ban_hanh_kem_Quyet_dinh', name: 'Mẫu Văn bản khác ban hành kèm Quyết định' },
  { id: '08_Mau_Van_ban_phe_duyet_kem_Quyet_dinh', name: 'Mẫu Văn bản phê duyệt kèm Quyết định' },
  { id: '09_Mau_Giay_uy_quyen', name: 'Mẫu Giấy ủy quyền' },
  { id: '10_Mau_Chi_thi', name: 'Mẫu Chỉ thị' },
  { id: '10_Mau_Chi_thi', name: 'Mẫu Chỉ thị' },
  { id: '11_Mau_Giay_trieu_tap', name: 'Mẫu Giấy triệu tập' },
  { id: '12_Mau_Ban_sao_van_ban_dien_tu', name: 'Mẫu Bản sao văn bản điện tử' },
  { id: '13_Mau_Giay_moi', name: 'Mẫu Giấy mời' },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reportSources, setReportSources] = useState<any[]>([]);
  const [cacheData, setCacheData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "monthly_details" | "weekly_mll" | "special5" | "petition" | "handover" | "inspection" | "generator" | "schedule">("overview");
  const [activeReportKey, setActiveReportKey] = useState<string | null>("upload");
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState<{currentWeek: number; currentYear: number} | null>(null);

  // Tờ trình form state
  const [toTrinhForm, setToTrinhForm] = useState({
    docNumber: '',
    docDate: '',
    title: '',
    to: '',
    baseClause: '',
    content: '',
    proposal: '',
    recipients: '',
    author: '',
    manager: '',
    role: 'GIÁM ĐỐC'
  });

  
  // Mẫu 3a form state
  const [form3b, setForm3b] = useState({
    title: '',
    to: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: ''
  });
  const [form10, setForm10] = useState({ 
    title: '', 
    bases: [''],
    articles: [''],
    role: 'GIÁM ĐỐC', 
    signerName: '', 
    unit6: '', 
    author7: '', 
    eoffice8: '' 
  });
  const [form11, setForm11] = useState({ 
    title: '', 
    bases: [''],
    articles: [''],
    role: 'GIÁM ĐỐC', 
    signerName: '', 
    unit6: '', 
    author7: '', 
    eoffice8: '' 
  });
  const [form13, setForm13] = useState({
    title: '',
    donViBanHanh: '',
    nguoiDuocMoi: '',
    tenCuocHop: '',
    chuTri: '',
    thoiGian: '',
    diaDiem: '',
    luuY: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit10: '',
    author11: '',
    eoffice12: ''
  });
  const [form5, setForm5] = useState({
    title: '',
    bases: [''],
    articles: [''],
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });
  const [form4, setForm4] = useState({
    title: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: ''
  });
  const [form9, setForm9] = useState({
    nguoiUyQuyen: '',
    nguoiDuocUyQuyen: '',
    bases: [''],
    articles: [''],
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });

  const [form3a, setForm3a] = useState({
    title: '',
    to: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: ''
  });

  // Mẫu Báo Cáo form state
  const [baoCaoForm, setBaoCaoForm] = useState({
    title: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: '',
  });
  const [isExportingToTrinh, setIsExportingToTrinh] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayName = days[now.getDay()];
      const str = `${dayName}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setCurrentTimeStr(str);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);

    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    setDateInfo({ currentWeek: week, currentYear: d.getUTCFullYear() });
    
    // Removed auto fill date as per user request

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setReportSources(json.sources);
        setCacheData(json.cache);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpload = async (key: ReportKey, file: File) => {
    setUploadingKey(key);
    const uploadToast = toast.loading(`Đang tải lên file ${file.name}...`);
    try {
      // 1. Upload trực tiếp từ client lên Vercel Blob để né giới hạn payload 4.5MB của API Next.js
      const blob = await upload(`reports/${key}/${key}_${Date.now()}.xlsx`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-token',
        multipart: true,
      });

      // 2. Gửi thông tin file đã upload lên API để lưu vào CSDL
      const res = await fetch(`/api/reports/${key}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          blobPathname: blob.pathname,
          fileName: file.name,
          fileSize: file.size
        }),
      });

      if (res.ok) {
        toast.success("Tải lên thành công!", { id: uploadToast });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(`Lỗi: ${errorData.error || errorData.message}`, { id: uploadToast });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Đã xảy ra lỗi khi tải lên: ${e.message}`, { id: uploadToast });
    }
    setUploadingKey(null);
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    const exportToast = toast.loading("Đang tạo báo cáo Word...");
    try {
      const blobUrls: Record<string, string> = {};
      for (const row of reportSources) {
        if (row.blob_url) {
          blobUrls[row.key] = row.blob_url;
        }
      }
      
      if (Object.keys(blobUrls).length < 8) {
        toast.error("Chưa đủ 8 file Excel. Vui lòng tải lên đầy đủ.", { id: exportToast });
        setIsExporting(false);
        return;
      }

      // Bypass Vercel timeout bằng cách gọi thẳng Render backend
      const backendUrl = process.env.NEXT_PUBLIC_CD5_BACKEND_URL || 'https://vnpt-tayninh-report.onrender.com';
      const apiRes = await fetch(`${backendUrl}/export-word`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrls })
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        toast.error(`Lỗi tạo Word (${apiRes.status}): ${errText}`, { id: exportToast });
        setIsExporting(false);
        return;
      }

      const wordBlob = await apiRes.blob();
      const formData = new FormData();
      formData.append("file", wordBlob, "report.docx");

      const saveRes = await fetch("/api/export-word-save", {
        method: "POST",
        body: formData
      });

      const json = await saveRes.json();
      if (saveRes.ok && json.blobUrl) {
        toast.success("Xuất báo cáo thành công!", { id: exportToast });
        window.open(json.blobUrl, "_blank");
      } else {
        toast.error(json.error || "Lỗi khi lưu file Word", { id: exportToast });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Lỗi xuất Word: ${e.message}`, { id: exportToast });
    }
    setIsExporting(false);
  };

  const handleExportMonthlyWord = async () => {
    setIsExporting(true);
    const exportToast = toast.loading("Đang tạo báo cáo Tháng...");
    try {
      const blobUrls: Record<string, string> = {};
      for (const row of reportSources) {
        if (row.blob_url) {
          blobUrls[row.key] = row.blob_url;
        }
      }
      
      if (Object.keys(blobUrls).length < 13) {
        toast.error("Chưa đủ 13 file Excel. Vui lòng tải lên đầy đủ.", { id: exportToast });
        setIsExporting(false);
        return;
      }

      // Bypass Vercel timeout bằng cách gọi thẳng Render backend
      const backendUrl = process.env.NEXT_PUBLIC_CD5_BACKEND_URL || 'https://vnpt-tayninh-report.onrender.com';
      const apiRes = await fetch(`${backendUrl}/export-word-monthly`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrls })
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        toast.error(`Lỗi tạo Word (${apiRes.status}): ${errText}`, { id: exportToast });
        setIsExporting(false);
        return;
      }

      const wordBlob = await apiRes.blob();
      const formData = new FormData();
      formData.append("file", wordBlob, "monthly_report.docx");

      const saveRes = await fetch("/api/export-word-save", {
        method: "POST",
        body: formData
      });

      const json = await saveRes.json();
      if (saveRes.ok && json.blobUrl) {
        toast.success("Xuất báo cáo Tháng thành công!", { id: exportToast });
        window.open(json.blobUrl, "_blank");
      } else {
        toast.error(json.error || "Lỗi khi lưu file Word", { id: exportToast });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Lỗi xuất Word: ${e.message}`, { id: exportToast });
    }
    setIsExporting(false);
  };

  const handleExportWeeklyMll = async () => {
    setIsExporting(true);
    const exportToast = toast.loading("Đang tạo báo cáo MLL Tuần...");
    try {
      const blobUrls: Record<string, string> = {};
      for (const row of reportSources) {
        if (row.blob_url) {
          blobUrls[row.key] = row.blob_url;
        }
      }
      
      if (!blobUrls['weekly1'] || !blobUrls['weekly2']) {
        toast.error("Chưa đủ 2 file Excel. Vui lòng tải lên đầy đủ.", { id: exportToast });
        setIsExporting(false);
        return;
      }

      // Bypass Vercel timeout bằng cách gọi thẳng Render backend
      const backendUrl = process.env.NEXT_PUBLIC_CD5_BACKEND_URL || 'https://vnpt-tayninh-report.onrender.com';
      const apiRes = await fetch(`${backendUrl}/export-word-weekly`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrls })
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        toast.error(`Lỗi tạo Word (${apiRes.status}): ${errText}`, { id: exportToast });
        setIsExporting(false);
        return;
      }

      const wordBlob = await apiRes.blob();
      const formData = new FormData();
      formData.append("file", wordBlob, "Mất_liên_lạc_Tuần.docx");

      const saveRes = await fetch("/api/export-word-save", {
        method: "POST",
        body: formData
      });

      const json = await saveRes.json();
      if (saveRes.ok && json.blobUrl) {
        toast.success("Xuất báo cáo MLL Tuần thành công!", { id: exportToast });
        window.open(json.blobUrl, "_blank");
      } else {
        toast.error(json.error || "Lỗi khi lưu file Word", { id: exportToast });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Lỗi xuất Word: ${e.message}`, { id: exportToast });
    }
    setIsExporting(false);
    setIsExporting(false);
  };

  const handleExport3b = async () => {
    try {
      const response = await fetch('/api/export-3b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form3b)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Cong_van_3b.docx';
        a.click();
      } else {
        alert('Có lỗi xảy ra khi tạo file Word');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };

  const handleExport5 = async () => {
    try {
      const formattedBases = form5.bases.filter(b => b.trim()).map((b, i) => form5.bases.length === 1 ? `Căn cứ ${b}` : `- Căn cứ ${b}`).join('\n');
      const formattedArticles = form5.articles.filter(a => a.trim()).map((a, i) => `Điều ${i + 1}. ${a}`).join('\n');
      const payload = {
        ...form5,
        bases: formattedBases,
        article1: formattedArticles
      };
      
      const response = await fetch('/api/export-05', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Quyet_dinh_05.docx';
        a.click();
      } else {
        alert('Có lỗi xảy ra khi tạo file Word');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };

  const handleExport10 = async () => {
    try {
      const response = await fetch('/api/export-10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form10),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chi_thi_10_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất file Mẫu 10');
    }
  };

  const handleExport11 = async () => {
    try {
      const response = await fetch('/api/export-11', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form11),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Giay_trieu_tap_11_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất file Mẫu 11');
    }
  };

  const handleExport13 = async () => {
    try {
      const response = await fetch('/api/export-13', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form13),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Giay_moi_13_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất file Mẫu 13');
    }
  };

  const handleExport9 = async () => {
    try {
      const payload = {
        ...form9,
        role: form9.role.includes('GIÁM ĐỐC') ? form9.role : 'GIÁM ĐỐC'
      };
      
      const response = await fetch('/api/export-09', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Giay_uy_quyen_09_${new Date().getTime()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Có lỗi xảy ra khi xuất file Mẫu 09');
    }
  };

  const handleExport4 = async () => {
    try {
      const response = await fetch('/api/export-04', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form4)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Thong_bao_04.docx';
        a.click();
      } else {
        alert('Có lỗi xảy ra khi tạo file Word');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };

  const handleExport3a = async () => {
    setIsExportingToTrinh(true);
    const exportToast = toast.loading("Đang xuất Mẫu 3a...");
    try {
      const res = await fetch("/api/export-3a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form3a)
      });
      if (!res.ok) {
        toast.error("Lỗi tạo Word", { id: exportToast });
        setIsExportingToTrinh(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cong_van_3a.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Xuất Mẫu 3a thành công!", { id: exportToast });
    } catch (e) {
      toast.error("Lỗi mạng", { id: exportToast });
    } finally {
      setIsExportingToTrinh(false);
    }
  };

  const handleExportMauBaoCao = async () => {
    setIsExportingToTrinh(true);
    const exportToast = toast.loading("Đang tạo file Mẫu Báo Cáo...");
    try {
      const res = await fetch("/api/export-maubaocao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baoCaoForm)
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        a.download = `Mau_Bao_Cao_${today}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Tạo Mẫu Báo Cáo thành công!", { id: exportToast });
      } else {
        const errText = await res.text();
        toast.error(`Lỗi tạo Mẫu Báo Cáo (${res.status}): ${errText}`, { id: exportToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi mạng khi xuất Word", { id: exportToast });
    }
    setIsExportingToTrinh(false);
  };

  const handleExportToTrinh = async () => {
    setIsExportingToTrinh(true);
    const exportToast = toast.loading("Đang tạo file Tờ Trình...");
    try {
      const res = await fetch("/api/export-totrinh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toTrinhForm)
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        a.download = `To_trinh_${today}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Đã tải xuống file Word!", { id: exportToast });
      } else {
        const errorData = await res.json();
        toast.error(`Lỗi: ${errorData.error}`, { id: exportToast });
      }
    } catch (e) {
      toast.error("Lỗi mạng khi xuất file", { id: exportToast });
    }
    setIsExportingToTrinh(false);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    const processToast = toast.loading("Đang xử lý lại dữ liệu...");
    try {
      const res = await fetch("/api/reports/process", { method: "POST" });
      if (res.ok) {
        toast.success("Đã xử lý lại dữ liệu thành công", { id: processToast });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(`Lỗi khi xử lý dữ liệu: ${errorData.error || errorData.message || 'Lỗi không xác định'}`, { id: processToast });
      }
    } catch (e) {
      toast.error("Lỗi mạng khi xử lý", { id: processToast });
    }
    setIsProcessing(false);
  };

  // Removed handleAddUser, handleRemoveUser, handleUserChange as they are no longer needed for To Trinh

  if (loading || status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-gradient)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} className="fade-in">
           <VnptLogo style={{ width: 150 }} />
           <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Loader2 size={20} className="spin-anim" /> Đang tải dữ liệu...
           </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
           <VnptLogo style={{ width: '120px', height: 'auto' }} />
           <span className="sidebar-subtitle">TÂY NINH</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Tổng quan
          </button>
          <div className="nav-item-group">
            <button className={`nav-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
              Báo cáo hàng tuần
            </button>
            {activeTab === 'details' && cacheData && (
              <div className="submenu fade-in">
                <button className={`submenu-item ${activeReportKey === 'upload' ? 'active' : ''}`} onClick={() => setActiveReportKey('upload')}>
                  Quản lý nguồn dữ liệu
                </button>
                {[...cacheData.data.serviceReports, ...cacheData.data.operationReports].map(report => (
                  <button key={report.id} className={`submenu-item ${activeReportKey === report.id ? 'active' : ''}`} onClick={() => setActiveReportKey(report.id)}>
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="nav-item-group">
            <button className={`nav-item ${activeTab === 'monthly_details' ? 'active' : ''}`} onClick={() => setActiveTab('monthly_details')}>
              Báo cáo hàng tháng
            </button>
            {activeTab === 'monthly_details' && cacheData && (
              <div className="submenu fade-in">
                <button className={`submenu-item ${activeReportKey === 'upload' ? 'active' : ''}`} onClick={() => setActiveReportKey('upload')}>
                  Quản lý nguồn dữ liệu
                </button>
                {[...cacheData.data.serviceReports, ...cacheData.data.operationReports].map(report => (
                  <button key={report.id} className={`submenu-item ${activeReportKey === report.id ? 'active' : ''}`} onClick={() => setActiveReportKey(report.id)}>
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={`nav-item ${activeTab === 'weekly_mll' ? 'active' : ''}`} onClick={() => { setActiveTab('weekly_mll'); setActiveReportKey('upload'); }}>
            Mất liên lạc hàng tuần
          </button>
          <button className={`nav-item ${activeTab === 'special5' ? 'active' : ''}`} onClick={() => setActiveTab('special5')}>
            Báo cáo chuyên đề 5
          </button>
          <div className="nav-item-group">
            <button className={`nav-item ${activeTab === 'petition' ? 'active' : ''}`} onClick={() => { setActiveTab('petition'); if (activeTab !== 'petition') setActiveReportKey('02_Mau_To_trinh'); }}>
              Tạo Tờ Trình
            </button>
            {activeTab === 'petition' && (
              <div className="submenu fade-in">
                {PETITION_TEMPLATES.map(template => (
                  <button 
                    key={template.id} 
                    className={`submenu-item ${activeReportKey === template.id ? 'active' : ''}`} 
                    onClick={() => setActiveReportKey(template.id)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveTab('schedule'); setActiveReportKey('schedule'); }}>
            <Calendar size={18} /> Quản lý Lịch
          </button>
          <div className="nav-divider" />
          <button className={`nav-item ${activeTab === 'handover' ? 'active' : ''}`} onClick={() => setActiveTab('handover')}>
            Sổ Giao Ca
          </button>
          <button className={`nav-item ${activeTab === 'inspection' ? 'active' : ''}`} onClick={() => setActiveTab('inspection')}>
            Nhật Ký Kiểm Tra
          </button>
          <button className={`nav-item ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}>
            Nhật Ký MPD
          </button>
          <button className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            Lịch Trực Tuần
          </button>
        </nav>
        <div className="sidebar-footer">
           <button className="btn-logout" onClick={() => signOut()}>
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
             Đăng xuất
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <header className="dashboard-header" style={{
          height: 'auto',
          minHeight: 88,
          padding: '16px 40px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 91, 170, 0.12)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#005BAA', background: 'rgba(0, 91, 170, 0.08)', padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em' }}>
                🏢 VNPT TÂY NINH • TRUNG TÂM HẠ TẦNG
              </span>
              {currentTimeStr && (
                <span style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🕒 {currentTimeStr}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span> Trực tuyến
              </span>
            </div>
            <h1 className="header-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
              {activeTab === 'overview' && '📊 Tổng quan Hệ thống'}
              {activeTab === 'details' && activeReportKey === 'upload' && '📁 Quản lý Nguồn Dữ Liệu Tuần'}
              {activeTab === 'details' && activeReportKey !== 'upload' && '📝 Báo cáo hàng tuần'}
              {activeTab === 'monthly_details' && activeReportKey === 'upload' && '📁 Quản lý Nguồn Dữ Liệu Tháng'}
              {activeTab === 'monthly_details' && activeReportKey !== 'upload' && '📅 Báo cáo hàng tháng'}
              {activeTab === 'weekly_mll' && '📞 Báo cáo Mất liên lạc hàng tuần'}
              {activeTab === 'special5' && '📋 Báo cáo chuyên đề 5'}
              {activeTab === 'petition' && '📄 Tạo Tờ Trình'}
              {activeTab === 'handover' && '📓 Sổ Giao Ca Trực Bản Doanh'}
              {activeTab === 'inspection' && '📋 Nhật Ký Kiểm Tra Định Kỳ Hạ Tầng'}
              {activeTab === 'generator' && '⚡ Nhật Ký Kiểm Tra Máy Phát Điện'}
              {activeTab === 'schedule' && '📅 Lịch Trực Tuần & Quản Lý Phân Ca'}
              {activeTab !== 'petition' && activeTab !== 'handover' && activeTab !== 'inspection' && activeTab !== 'generator' && activeTab !== 'schedule' && (
                <span style={{ fontSize: '0.9rem', color: '#005BAA', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 12px', borderRadius: 8 }}>
                  Tuần {dateInfo?.currentWeek || '...'} / {dateInfo?.currentYear || '...'}
                </span>
              )}
            </h1>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
               {(activeTab === 'details' || activeTab === 'monthly_details') && activeReportKey === 'upload' && (
                  <button className="btn-action btn-outline" onClick={handleProcess} disabled={isProcessing}>
                    {isProcessing ? <Loader2 size={18} className="spin-anim" /> : '🔄'} 
                    {isProcessing ? 'Đang xử lý...' : 'Xử lý lại dữ liệu'}
                  </button>
               )}
               {activeTab === 'petition' ? (
                  <button className="btn-export" onClick={() => {
                    if (activeReportKey === '01_Mau_Bao_cao') handleExportMauBaoCao();
                    else if (activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len') handleExport3a();
                    else if (activeReportKey === '04_Mau_Thong_bao') handleExport4();
                    else if (activeReportKey === '05_Mau_Quyet_dinh_quy_dinh_truc_tiep') handleExport5();
                    else if (activeReportKey === '03b_Mau_Cong_van_gui_1_don_vi') handleExport3b();
                    else handleExportToTrinh();
                  }} disabled={isExportingToTrinh}>
                    {isExportingToTrinh ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                    {isExportingToTrinh ? 'Đang tạo Word...' : `Xuất ${PETITION_TEMPLATES.find(t => t.id === activeReportKey)?.name || 'Tờ Trình'} (Word)`}
                  </button>
               ) : (activeTab === 'handover' || activeTab === 'inspection' || activeTab === 'generator' || activeTab === 'schedule' || activeTab === 'overview' || activeTab === 'special5') ? null : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {activeTab === 'details' && (
                      <button className="btn-export" onClick={handleExportWord} disabled={isExporting || !cacheData}>
                        {isExporting ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                        {isExporting ? 'Đang tạo...' : 'Xuất Báo Cáo Tuần'}
                      </button>
                    )}
                    {activeTab === 'monthly_details' && (
                      <button className="btn-export" onClick={handleExportMonthlyWord} disabled={isExporting || !cacheData} style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                        {isExporting ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                        {isExporting ? 'Đang tạo...' : 'Xuất Báo Cáo Tháng'}
                      </button>
                    )}
                    {activeTab === 'weekly_mll' && (
                      <button className="btn-export" onClick={handleExportWeeklyMll} disabled={isExporting} style={{ background: 'linear-gradient(135deg, #F25022, #D83B01)' }}>
                        {isExporting ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                        {isExporting ? 'Đang tạo...' : 'Xuất Báo Cáo MLL Tuần'}
                      </button>
                    )}
                  </div>
               )}
               <div style={{ height: 32, width: 1, background: '#cbd5e1', margin: '0 4px' }}></div>
               <div className="user-profile" style={{ 
                 display: 'flex', alignItems: 'center', gap: 12, 
                 background: '#f8fafc', padding: '6px 14px 6px 6px', 
                 borderRadius: 50, border: '1px solid #e2e8f0',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
               }}>
                  <div className="user-avatar" style={{ 
                    width: 38, height: 38, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #005BAA, #003366)', 
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 700, fontSize: '1rem', boxShadow: '0 2px 6px rgba(0,91,170,0.3)'
                  }}>
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.2 }}>{session.user?.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Tài khoản VNPT</span>
                  </div>
               </div>
            </div>
        </header>

        <div className="dashboard-content fade-in">
           {/* TAB OVERVIEW */}
           {activeTab === 'overview' && (
             <div>
                {!cacheData ? (
                  <div className="card-glass" style={{ textAlign: 'center', padding: '100px 0' }}>
                    <h2 className="section-title">Chưa có dữ liệu</h2>
                    <p className="content-text">Vui lòng vào <strong>Báo cáo hàng tuần &gt; Quản lý nguồn dữ liệu</strong> để tải lên đủ 8 file Excel.</p>
                  </div>
                ) : (
                  <>
                    <section className="card-glass" style={{ marginBottom: 40, display: 'flex', gap: 40, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <p className="section-subtitle">{cacheData.data.hero.kicker}</p>
                        <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: 20 }}>{cacheData.data.hero.title}</h1>
                        <p className="content-text" style={{ fontSize: '1.1rem' }}>Báo cáo tổng hợp số liệu tự động từ các trạm và đơn vị, cập nhật theo thời gian thực.</p>
                      </div>
                      <div style={{ background: 'var(--bg-gradient)', padding: 32, borderRadius: 20, border: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 40 }}>
                        <div>
                          <div className="metric-label">Tổng nguồn Excel</div>
                          <div className="metric-value">{reportSources.filter((s: any) => s.blob_url).length}<span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>/10</span></div>
                        </div>
                        <div>
                          <div className="metric-label">Cập nhật lần cuối</div>
                          <div className="metric-value" style={{ fontSize: '1.2rem', marginTop: 8 }}>{new Date(cacheData.generated_at).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    </section>

                    <section className="card-glass">
                      <div className="section-title">Tổng quan tín hiệu</div>
                      <p className="content-text" style={{ marginBottom: 30 }}>Các chỉ số nổi bật trong tuần từ tất cả các đơn vị.</p>
                      <div className="metrics-grid">
                        {cacheData.data.signalBands.map((band: any, i: number) => (
                          <div key={i} className="metric-card" style={{ borderLeft: `4px solid ${band.tone === 'positive' ? 'var(--success-text)' : band.tone === 'warning' ? 'var(--warning-text)' : 'var(--primary-color)'}` }}>
                            <div className="metric-label">{band.label}</div>
                            <div className="metric-value">{band.value}</div>
                            <div className="content-text" style={{ fontSize: '0.85rem', marginTop: 12 }}>{band.note}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
             </div>
           )}

           {/* TAB DETAILS */}
           {activeTab === 'details' && (
             <div className="fade-in">
               {activeReportKey === 'upload' ? (
                 <>
                   <div style={{ marginBottom: 32 }}>
                     <h2 className="section-title">Quản lý Nguồn dữ liệu</h2>
                     <p className="content-text">Tải lên 8 file Excel báo cáo thành phần để hệ thống bắt đầu tổng hợp.</p>
                   </div>
                   <div className="upload-grid">
                      {REPORT_SOURCES.map((source) => {
                        const dbSource = reportSources.find((s) => s.key === source.key);
                        return (
                          <div key={source.key} className="upload-card">
                            <div className="upload-card-header">
                              <div className="upload-card-title">{source.label}</div>
                              <div className="upload-card-subtitle">{source.filename}</div>
                              <div className="upload-card-subtitle" style={{ marginTop: 8 }}>Phụ trách: <strong>{source.owner}</strong></div>
                            </div>
                            <div className="upload-card-status">
                              {dbSource?.blob_url ? (
                                <>
                                  <span className="status-badge success">✅ Đã có dữ liệu</span>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                    <div>Lúc: {new Date(dbSource.uploaded_at).toLocaleString('vi-VN')}</div>
                                  </div>
                                </>
                              ) : (
                                <span className="status-badge error">❌ Chưa có dữ liệu</span>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                {dbSource?.blob_url && (
                                  <a
                                    href={dbSource.blob_url}
                                    download={source.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      padding: '10px 14px',
                                      borderRadius: 8,
                                      background: '#10b981',
                                      color: '#fff',
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                                    }}
                                  >
                                    ⬇️ Tải xuống file Excel ({source.owner})
                                  </a>
                                )}

                                  <a
                                    href={`/templates/${encodeURIComponent(source.filename)}`}
                                    download={source.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      padding: '10px 14px',
                                      borderRadius: 8,
                                      background: '#3b82f6',
                                      color: '#fff',
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)',
                                    }}
                                  >
                                    📥 Tải file mẫu
                                  </a>

                                  <div className="file-input-wrapper">
                                  <button className="btn-upload" style={{ width: '100%' }}>
                                    {uploadingKey === source.key ? (
                                      <><Loader2 size={18} className="spin-anim" /> Đang tải lên...</>
                                    ) : (
                                      dbSource?.blob_url ? '🔄 Tải file lên mới' : '⬆️ Tải file lên'
                                    )}
                                  </button>
                                  <input type="file" accept=".xlsx" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(source.key, file);
                                  }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                 </>
               ) : (
                  <div>
                    {!cacheData ? (
                      <div className="card-glass" style={{ textAlign: 'center', padding: '100px 0' }}>
                        <h2 className="section-title">Chưa có dữ liệu</h2>
                      </div>
                    ) : (
                      <div className="card-glass">
                        {(() => {
                          const report = [...cacheData.data.serviceReports, ...cacheData.data.operationReports].find((r: any) => r.id === activeReportKey);
                          if (!report) return null;
                          return (
                            <div className="fade-in">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                                <div>
                                  <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: 6 }}>{report.title}</h2>
                                  <p className="section-subtitle">{report.kicker}</p>
                                </div>
                                {(() => {
                                  const dbSource = reportSources.find((s: any) => s.key === activeReportKey);
                                  if (!dbSource?.blob_url) return null;
                                  const sourceInfo = REPORT_SOURCES.find(s => s.key === activeReportKey);
                                  return (
                                    <a
                                      href={dbSource.blob_url}
                                      download={sourceInfo?.filename || `${activeReportKey}.xlsx`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 18px',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                        transition: 'all 0.2s',
                                      }}
                                    >
                                      ⬇️ Tải xuống file Excel ({sourceInfo?.owner || 'Nguồn'})
                                    </a>
                                  );
                                })()}
                              </div>
                              <p className="content-text" style={{ fontSize: '1.1rem', marginBottom: 40 }}>{report.summary}</p>
                              
                              {report.table && report.table.rows && report.table.rows.length > 0 && (
                                <div style={{ marginBottom: 48 }}>
                                  <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 20 }}>{report.table.title}</h3>
                                  <div className="table-container">
                                    <table className="data-table">
                                      <thead>
                                        <tr>
                                          {report.table.columns.map((col: string, i: number) => <th key={i}>{col}</th>)}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {report.table.rows.map((row: any, i: number) => (
                                          <tr key={i}>
                                            {report.table.columns.map((col: string, j: number) => <td key={j}>{row[col]}</td>)}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
               )}
             </div>
           )}

           {/* TAB MONTHLY DETAILS */}
           {activeTab === 'monthly_details' && (
             <div className="fade-in">
               {activeReportKey === 'upload' ? (
                 <>
                   <div style={{ marginBottom: 32 }}>
                     <h2 className="section-title">Quản lý Nguồn dữ liệu (Báo cáo Tháng)</h2>
                     <p className="content-text">Tải lên 10 file Excel báo cáo thành phần để hệ thống bắt đầu tổng hợp báo cáo tháng.</p>
                   </div>
                   <div className="upload-grid">
                      {MONTHLY_REPORT_SOURCES.map((source) => {
                        const dbSource = reportSources.find((s) => s.key === source.key);
                        return (
                          <div key={source.key} className="upload-card">
                            <div className="upload-card-header">
                              <div className="upload-card-title">{source.label}</div>
                              <div className="upload-card-subtitle">{source.filename}</div>
                              <div className="upload-card-subtitle" style={{ marginTop: 8 }}>Phụ trách: <strong>{source.owner}</strong></div>
                            </div>
                            <div className="upload-card-status">
                              {dbSource?.blob_url ? (
                                <>
                                  <span className="status-badge success">✅ Đã có dữ liệu</span>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                    <div>Lúc: {new Date(dbSource.uploaded_at).toLocaleString('vi-VN')}</div>
                                  </div>
                                </>
                              ) : (
                                <span className="status-badge error">❌ Chưa có dữ liệu</span>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                {dbSource?.blob_url && (
                                  <a
                                    href={dbSource.blob_url}
                                    download={source.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      padding: '10px 14px',
                                      borderRadius: 8,
                                      background: '#10b981',
                                      color: '#fff',
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                                    }}
                                  >
                                    ⬇️ Tải xuống file Excel ({source.owner})
                                  </a>
                                )}

                                  <a
                                    href={`/templates/${encodeURIComponent(source.filename)}`}
                                    download={source.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      padding: '10px 14px',
                                      borderRadius: 8,
                                      background: '#3b82f6',
                                      color: '#fff',
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)',
                                    }}
                                  >
                                    📥 Tải file mẫu
                                  </a>

                                  <div className="file-input-wrapper">
                                  <button className="btn-upload" style={{ width: '100%' }}>
                                    {uploadingKey === source.key ? (
                                      <><Loader2 size={18} className="spin-anim" /> Đang tải lên...</>
                                    ) : (
                                      dbSource?.blob_url ? '🔄 Tải file lên mới' : '⬆️ Tải file lên'
                                    )}
                                  </button>
                                  <input type="file" accept=".xlsx" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(source.key, file);
                                  }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                 </>
               ) : (
                  <div>
                    {!cacheData ? (
                      <div className="card-glass" style={{ textAlign: 'center', padding: '100px 0' }}>
                        <h2 className="section-title">Chưa có dữ liệu</h2>
                      </div>
                    ) : (
                      <div className="card-glass">
                        {(() => {
                          const report = [...cacheData.data.serviceReports, ...cacheData.data.operationReports].find((r: any) => r.id === activeReportKey);
                          if (!report) return null;
                          return (
                            <div className="fade-in">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                                <div>
                                  <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: 6 }}>{report.title}</h2>
                                  <p className="section-subtitle">{report.kicker}</p>
                                </div>
                                {(() => {
                                  const dbSource = reportSources.find((s: any) => s.key === activeReportKey);
                                  if (!dbSource?.blob_url) return null;
                                  const sourceInfo = MONTHLY_REPORT_SOURCES.find(s => s.key === activeReportKey);
                                  return (
                                    <a
                                      href={dbSource.blob_url}
                                      download={sourceInfo?.filename || `${activeReportKey}.xlsx`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 18px',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                        transition: 'all 0.2s',
                                      }}
                                    >
                                      ⬇️ Tải xuống file Excel ({sourceInfo?.owner || 'Nguồn'})
                                    </a>
                                  );
                                })()}
                              </div>
                              <p className="content-text" style={{ fontSize: '1.1rem', marginBottom: 40 }}>{report.summary}</p>
                              
                              {report.table && report.table.rows && report.table.rows.length > 0 && (
                                <div style={{ marginBottom: 48 }}>
                                  <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 20 }}>{report.table.title}</h3>
                                  <div className="table-container">
                                    <table className="data-table">
                                      <thead>
                                        <tr>
                                          {report.table.columns.map((col: string, i: number) => <th key={i}>{col}</th>)}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {report.table.rows.map((row: any, i: number) => (
                                          <tr key={i}>
                                            {report.table.columns.map((col: string, j: number) => <td key={j}>{row[col]}</td>)}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
               )}
             </div>
           )}

           {/* TAB WEEKLY MLL */}
           {activeTab === 'weekly_mll' && (
             <div className="fade-in">
               <div style={{ marginBottom: 32 }}>
                 <h2 className="section-title">Quản lý Nguồn dữ liệu (MLL Tuần)</h2>
                 <p className="content-text">Tải lên 2 file Excel báo cáo thành phần để hệ thống tạo báo cáo.</p>
               </div>
               <div className="upload-grid">
                  {WEEKLY_MLL_SOURCES.map((source) => {
                    const dbSource = reportSources.find((s) => s.key === source.key);
                    return (
                      <div key={source.key} className="upload-card">
                        <div className="upload-card-header">
                          <div className="upload-card-title">{source.label}</div>
                          <div className="upload-card-subtitle">{source.filename}</div>
                          <div className="upload-card-subtitle" style={{ marginTop: 8 }}>Phụ trách: <strong>{source.owner}</strong></div>
                        </div>
                        <div className="upload-card-status">
                          {dbSource?.blob_url ? (
                            <>
                              <span className="status-badge success">✅ Đã có dữ liệu</span>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                <div>Lúc: {new Date(dbSource.uploaded_at).toLocaleString('vi-VN')}</div>
                              </div>
                            </>
                          ) : (
                            <span className="status-badge error">❌ Chưa có dữ liệu</span>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                            {dbSource?.blob_url && (
                              <a
                                href={dbSource.blob_url}
                                download={source.filename}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '10px 14px',
                                  borderRadius: 8,
                                  background: '#10b981',
                                  color: '#fff',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  textDecoration: 'none',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                                }}
                              >
                                ⬇️ Tải xuống file Excel
                              </a>
                            )}

                                  <div className="file-input-wrapper">
                              <button className="btn-upload" style={{ width: '100%' }}>
                                {uploadingKey === source.key ? (
                                  <><Loader2 size={18} className="spin-anim" /> Đang tải lên...</>
                                ) : (
                                  dbSource?.blob_url ? '🔄 Tải file lên mới' : '⬆️ Tải file lên'
                                )}
                              </button>
                              <input type="file" accept=".xlsx" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(source.key, file);
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
             </div>
           )}

           {/* TAB SPECIAL5 */}
           {activeTab === 'special5' && <Special5Report />}

           {/* TAB PETITION -> TO TRINH */}
           {activeTab === 'petition' && (
             <div className="fade-in">
                <div className="card-glass" style={{ padding: '32px 40px', marginBottom: 24 }}>
                  <h2 className="section-title" style={{ marginBottom: 24 }}>Thông tin {PETITION_TEMPLATES.find(t => t.id === activeReportKey)?.name || 'Tờ Trình'}</h2>
                  
                  {activeReportKey === '01_Mau_Bao_cao' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                       <div style={{ gridColumn: '1 / -1' }}>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Trích yếu nội dung (Tiêu đề) - Về việc...</label>
                         <input type="text" value={baoCaoForm.title} onChange={e => setBaoCaoForm(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                       </div>
                       <div style={{ gridColumn: '1 / -1' }}>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung văn bản</label>
                         <textarea value={baoCaoForm.content} onChange={e => setBaoCaoForm(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                       </div>
                       <div>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức vụ người ký</label>
                         <select value={baoCaoForm.role} onChange={e => setBaoCaoForm(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                           <option value="GIÁM ĐỐC">GIÁM ĐỐC</option>
                           <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. GIÁM ĐỐC - PHÓ GIÁM ĐỐC</option>
                         </select>
                       </div>
                       <div>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Họ và tên người ký</label>
                         <input type="text" value={baoCaoForm.signerName} onChange={e => setBaoCaoForm(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                       </div>
                       <div>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị chủ trì (Ví dụ: TTHT)</label>
                         <input type="text" value={baoCaoForm.unit6} onChange={e => setBaoCaoForm(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                       </div>
                       <div>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người soạn thảo (Ví dụ: NTLuan)</label>
                         <input type="text" value={baoCaoForm.author7} onChange={e => setBaoCaoForm(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                       </div>
                       <div style={{ gridColumn: '1 / -1' }}>
                         <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                         <input type="text" value={baoCaoForm.eoffice8} onChange={e => setBaoCaoForm(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                       </div>
                    </div>
                  ) : activeReportKey === '02_Mau_To_trinh' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={toTrinhForm.title} onChange={e => setToTrinhForm(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Kính gửi</label>
                        <input type="text" value={toTrinhForm.to} onChange={e => setToTrinhForm(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ pháp lý / Tình hình</label>
                        <textarea value={toTrinhForm.baseClause} onChange={e => setToTrinhForm(p => ({ ...p, baseClause: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                        <textarea value={toTrinhForm.content} onChange={e => setToTrinhForm(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đề xuất / Kiến nghị</label>
                        <textarea value={toTrinhForm.proposal} onChange={e => setToTrinhForm(p => ({ ...p, proposal: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={toTrinhForm.role} onChange={e => setToTrinhForm(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                           <option value="GIÁM ĐỐC">GIÁM ĐỐC</option>
                           <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. GIÁM ĐỐC - PHÓ GIÁM ĐỐC</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Phê duyệt</label>
                        <input type="text" value={toTrinhForm.manager} onChange={e => setToTrinhForm(p => ({ ...p, manager: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người Lập (Người Đề nghị)</label>
                        <input type="text" value={toTrinhForm.author} onChange={e => setToTrinhForm(p => ({ ...p, author: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nơi nhận</label>
                        <textarea value={toTrinhForm.recipients} onChange={e => setToTrinhForm(p => ({ ...p, recipients: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                      </div>
                    </div>
                  ) : activeReportKey === '03b_Mau_Cong_van_gui_1_don_vi' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form3b.title} onChange={e => setForm3b(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Kính gửi (mỗi đơn vị một dòng)</label>
                        <textarea value={form3b.to} onChange={e => setForm3b(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                        <textarea value={form3b.content} onChange={e => setForm3b(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form3b.role} onChange={e => setForm3b(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form3b.signerName} onChange={e => setForm3b(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form3b.unit6} onChange={e => setForm3b(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form3b.author7} onChange={e => setForm3b(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form3b.eoffice8} onChange={e => setForm3b(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                    </div>

                  ) : activeReportKey === '05_Mau_Quyet_dinh_quy_dinh_truc_tiep' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form5.title} onChange={e => setForm5(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ (5)</label>
                          <button onClick={() => setForm5(p => ({ ...p, bases: [...p.bases, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Căn cứ</button>
                        </div>
                        {form5.bases.map((base, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={base} onChange={e => {
                              const newBases = [...form5.bases];
                              newBases[idx] = e.target.value;
                              setForm5(p => ({ ...p, bases: newBases }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} placeholder={`Nội dung căn cứ ${idx + 1}`} />
                            {form5.bases.length > 1 && (
                              <button onClick={() => {
                                const newBases = form5.bases.filter((_, i) => i !== idx);
                                setForm5(p => ({ ...p, bases: newBases }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Các Điều (6)</label>
                          <button onClick={() => setForm5(p => ({ ...p, articles: [...p.articles, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Điều</button>
                        </div>
                        {form5.articles.map((article, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={article} onChange={e => {
                              const newArticles = [...form5.articles];
                              newArticles[idx] = e.target.value;
                              setForm5(p => ({ ...p, articles: newArticles }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} placeholder={`Nội dung Điều ${idx + 1}`} />
                            {form5.articles.length > 1 && (
                              <button onClick={() => {
                                const newArticles = form5.articles.filter((_, i) => i !== idx);
                                setForm5(p => ({ ...p, articles: newArticles }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form5.role} onChange={e => setForm5(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form5.signerName} onChange={e => setForm5(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nơi nhận (Lưu VT, ...)</label>
                        <input type="text" value={form5.unit8} onChange={e => setForm5(p => ({ ...p, unit8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người soạn thảo</label>
                        <input type="text" value={form5.author9} onChange={e => setForm5(p => ({ ...p, author9: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                    </div>
                  ) : activeReportKey === '10_Mau_Chi_thi' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form10.title} onChange={e => setForm10(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ (4)</label>
                          <button onClick={() => setForm10(p => ({ ...p, bases: [...p.bases, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Căn cứ</button>
                        </div>
                        {form10.bases.map((base, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={base} onChange={e => {
                              const newBases = [...form10.bases];
                              newBases[idx] = e.target.value;
                              setForm10(p => ({ ...p, bases: newBases }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} placeholder={`Nội dung căn cứ ${idx + 1}`} />
                            {form10.bases.length > 1 && (
                              <button onClick={() => {
                                const newBases = form10.bases.filter((_, i) => i !== idx);
                                setForm10(p => ({ ...p, bases: newBases }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Các Điều</label>
                          <button onClick={() => setForm10(p => ({ ...p, articles: [...p.articles, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Điều</button>
                        </div>
                        {form10.articles.map((article, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={article} onChange={e => {
                              const newArticles = [...form10.articles];
                              newArticles[idx] = e.target.value;
                              setForm10(p => ({ ...p, articles: newArticles }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} placeholder={`Nội dung Điều ${idx + 1}`} />
                            {form10.articles.length > 1 && (
                              <button onClick={() => {
                                const newArticles = form10.articles.filter((_, i) => i !== idx);
                                setForm10(p => ({ ...p, articles: newArticles }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form10.role} onChange={e => setForm10(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form10.signerName} onChange={e => setForm10(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form10.unit6} onChange={e => setForm10(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form10.author7} onChange={e => setForm10(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form10.eoffice8} onChange={e => setForm10(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
                        <button onClick={handleExport10} style={{ width: '100%', padding: '14px', background: '#0066cc', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Xuất file Mẫu 10
                        </button>
                      </div>
                    </div>
                  ) : activeReportKey === '11_Mau_Giay_trieu_tap' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề Hội nghị)</label>
                        <input type="text" value={form11.title} onChange={e => setForm11(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ</label>
                          <button onClick={() => setForm11(p => ({ ...p, bases: [...p.bases, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Căn cứ</button>
                        </div>
                        {form11.bases.map((base, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={base} onChange={e => {
                              const newBases = [...form11.bases];
                              newBases[idx] = e.target.value;
                              setForm11(p => ({ ...p, bases: newBases }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} placeholder={`Nội dung căn cứ ${idx + 1}`} />
                            {form11.bases.length > 1 && (
                              <button onClick={() => {
                                const newBases = form11.bases.filter((_, i) => i !== idx);
                                setForm11(p => ({ ...p, bases: newBases }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Các Điều / Nội dung chi tiết</label>
                          <button onClick={() => setForm11(p => ({ ...p, articles: [...p.articles, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Điều</button>
                        </div>
                        {form11.articles.map((article, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={article} onChange={e => {
                              const newArticles = [...form11.articles];
                              newArticles[idx] = e.target.value;
                              setForm11(p => ({ ...p, articles: newArticles }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} placeholder={`Nội dung Điều ${idx + 1}`} />
                            {form11.articles.length > 1 && (
                              <button onClick={() => {
                                const newArticles = form11.articles.filter((_, i) => i !== idx);
                                setForm11(p => ({ ...p, articles: newArticles }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form11.role} onChange={e => setForm11(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form11.signerName} onChange={e => setForm11(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form11.unit6} onChange={e => setForm11(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form11.author7} onChange={e => setForm11(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form11.eoffice8} onChange={e => setForm11(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
                        <button onClick={handleExport11} style={{ width: '100%', padding: '14px', background: '#0066cc', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Xuất file Mẫu 11
                        </button>
                      </div>
                    </div>
                  ) : activeReportKey === '09_Mau_Giay_uy_quyen' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người ủy quyền (3)</label>
                        <input type="text" placeholder="Họ tên, chức vụ, đơn vị công tác..." value={form9.nguoiUyQuyen} onChange={e => setForm9(p => ({ ...p, nguoiUyQuyen: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người được ủy quyền (4)</label>
                        <input type="text" placeholder="Họ tên, chức vụ, đơn vị công tác..." value={form9.nguoiDuocUyQuyen} onChange={e => setForm9(p => ({ ...p, nguoiDuocUyQuyen: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ</label>
                          <button onClick={() => setForm9(p => ({ ...p, bases: [...p.bases, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Căn cứ</button>
                        </div>
                        {form9.bases.map((base, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={base} onChange={e => {
                              const newBases = [...form9.bases];
                              newBases[idx] = e.target.value;
                              setForm9(p => ({ ...p, bases: newBases }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} placeholder={`Nội dung căn cứ ${idx + 1}`} />
                            {form9.bases.length > 1 && (
                              <button onClick={() => {
                                const newBases = form9.bases.filter((_, i) => i !== idx);
                                setForm9(p => ({ ...p, bases: newBases }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Nội dung ủy quyền / Các Điều (5)</label>
                          <button onClick={() => setForm9(p => ({ ...p, articles: [...p.articles, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Điều</button>
                        </div>
                        {form9.articles.map((article, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={article} onChange={e => {
                              const newArticles = [...form9.articles];
                              newArticles[idx] = e.target.value;
                              setForm9(p => ({ ...p, articles: newArticles }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} placeholder={`Nội dung ủy quyền ${idx + 1}`} />
                            {form9.articles.length > 1 && (
                              <button onClick={() => {
                                const newArticles = form9.articles.filter((_, i) => i !== idx);
                                setForm9(p => ({ ...p, articles: newArticles }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức vụ người ủy quyền (6)</label>
                        <select value={form9.role} onChange={e => setForm9(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                          <option value="GIÁM ĐỐC">GIÁM ĐỐC</option>
                          <option value="PHÓ GIÁM ĐỐC">PHÓ GIÁM ĐỐC</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người ký</label>
                        <input type="text" value={form9.signerName} onChange={e => setForm9(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị (7)</label>
                        <input type="text" value={form9.unit8} onChange={e => setForm9(p => ({ ...p, unit8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người soạn (8)</label>
                        <input type="text" value={form9.author9} onChange={e => setForm9(p => ({ ...p, author9: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
                        <button onClick={handleExport9} style={{ width: '100%', padding: '14px', background: '#0066cc', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Xuất file Mẫu 09
                        </button>
                      </div>
                    </div>
                  ) : activeReportKey === '04_Mau_Thong_bao' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form4.title} onChange={e => setForm4(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                        <textarea value={form4.content} onChange={e => setForm4(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form4.role} onChange={e => setForm4(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form4.signerName} onChange={e => setForm4(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form4.unit6} onChange={e => setForm4(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form4.author7} onChange={e => setForm4(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form4.eoffice8} onChange={e => setForm4(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                    </div>

                  ) : activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form3a.title} onChange={e => setForm3a(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Kính gửi (mỗi đơn vị một dòng)</label>
                        <textarea value={form3a.to} onChange={e => setForm3a(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                        <textarea value={form3a.content} onChange={e => setForm3a(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form3a.role} onChange={e => setForm3a(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form3a.signerName} onChange={e => setForm3a(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form3a.unit6} onChange={e => setForm3a(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form3a.author7} onChange={e => setForm3a(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form3a.eoffice8} onChange={e => setForm3a(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                    </div>

                  ) : activeReportKey === '13_Mau_Giay_moi' ? (
                    <div>
                      <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', color: '#0369a1' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Ghi chú:</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li>Các phần ghi: số: ký hiệu, ngày, tháng, năm của văn bản (để trống để hệ thống tự cập nhật).</li>
                          <li>Phần đề ký: để khoảng cách (thông thủy) từ chân dòng ghi chức vụ bên trên đến dòng ghi họ và tên của người ký văn bản bên dưới từ 4,5cm đến 5 cm</li>
                          <li>(1) Ghi rõ tên đơn vị ban hành giấy mời.</li>
                          <li>(2) Ghi địa danh.</li>
                          <li>(3) Trích yếu nội dung cuộc họp.</li>
                          <li>(4) Tên cơ đơn vị ban hành giấy mời.</li>
                          <li>(5) Tên cơ quan, tổ chức hoặc họ và tên, chức vụ, đơn vị công tác của người được mời.</li>
                          <li>(6) Tên (nội dung) của cuộc họp, hội thảo, hội nghị v.v..</li>
                          <li>(7) Ghi địa điểm họp.</li>
                          <li>(8) Các vấn đề lưu ý (nếu cần).</li>
                          <li>(9) Quyền hạn, chức vụ của người ký (chữ in hoa, đứng, đậm). Trường hợp cấp Phó ký thay cấp Trưởng thì chọn <strong>KT. Giám đốc / Phó Giám đốc</strong>.</li>
                          <li>(10) Chữ viết tắt tên đơn vị chủ trì soạn thảo và số lượng bản lưu.</li>
                          <li>(11) Ký hiệu của người soạn thảo và số lượng bản phát hành.</li>
                          <li>(12) Ghi số eOffice.</li>
                        </ul>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Trích yếu nội dung (3)</label>
                        <input type="text" value={form13.title} onChange={e => setForm13(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên đơn vị ban hành (4)</label>
                        <input type="text" value={form13.donViBanHanh} onChange={e => setForm13(p => ({ ...p, donViBanHanh: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người/Cơ quan được mời (5)</label>
                        <input type="text" value={form13.nguoiDuocMoi} onChange={e => setForm13(p => ({ ...p, nguoiDuocMoi: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên cuộc họp/hội nghị (6)</label>
                        <input type="text" value={form13.tenCuocHop} onChange={e => setForm13(p => ({ ...p, tenCuocHop: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chủ trì</label>
                        <input type="text" value={form13.chuTri} onChange={e => setForm13(p => ({ ...p, chuTri: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Thời gian</label>
                        <input type="text" value={form13.thoiGian} onChange={e => setForm13(p => ({ ...p, thoiGian: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Địa điểm (7)</label>
                        <input type="text" value={form13.diaDiem} onChange={e => setForm13(p => ({ ...p, diaDiem: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Lưu ý (8)</label>
                        <input type="text" value={form13.luuY} onChange={e => setForm13(p => ({ ...p, luuY: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt (9)</label>
                        <select value={form13.role} onChange={e => setForm13(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form13.signerName} onChange={e => setForm13(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (10)</label>
                        <input type="text" value={form13.unit10} onChange={e => setForm13(p => ({ ...p, unit10: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (11)</label>
                        <input type="text" value={form13.author11} onChange={e => setForm13(p => ({ ...p, author11: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (12)</label>
                        <input type="text" value={form13.eoffice12} onChange={e => setForm13(p => ({ ...p, eoffice12: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
                        <button onClick={handleExport13} style={{ width: '100%', padding: '14px', background: '#0066cc', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Xuất file Mẫu 13
                        </button>
                      </div>
                    </div>
                    </div>

                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                       Mẫu này đang được cập nhật, chưa hỗ trợ điền tự động. Vui lòng sử dụng Mẫu Báo cáo hoặc Mẫu Tờ trình.
                    </div>
                  )}
                </div>
             </div>
           )}

           {/* TAB HANDOVER */}
           {activeTab === 'handover' && <ShiftHandover user={session.user} />}

           {/* TAB INSPECTION */}
           {activeTab === 'inspection' && <InspectionLog user={session.user} />}

           {/* TAB GENERATOR */}
           {activeTab === 'generator' && <GeneratorLog user={session.user} />}

           {/* TAB SCHEDULE */}
           {activeTab === 'schedule' && <WeeklySchedule user={session.user} />}
        </div>
        
        {/* DASHBOARD FOOTER */}
        <Footer />
      </main>
    </div>
  );
}
