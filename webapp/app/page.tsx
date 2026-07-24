"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { REPORT_SOURCES, type ReportKey } from "@/lib/reports";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ShiftHandover from "@/components/ShiftHandover";
import "./dashboard.css";
import VnptLogo from "@/components/VnptLogo";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reportSources, setReportSources] = useState<any[]>([]);
  const [cacheData, setCacheData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "special5" | "petition" | "handover">("overview");
  const [activeReportKey, setActiveReportKey] = useState<string | null>("upload");
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState<{currentWeek: number; currentYear: number} | null>(null);

  // Petition form state
  const [petitionForm, setPetitionForm] = useState({
    docNumber: '1975/ĐN-TTHT-KTHT',
    docDate: 'tháng 07 năm 2026',
    baseClause: 'Căn cứ tờ trình số 1937/TTr-TTHT ngày 17/06/2026 của Trung tâm Hạ tầng V/v xét duyệt tăng nhân viên cho Tổ Khai thác hệ thống đã được Giám đốc Viễn thông Tây Ninh phê duyệt;',
    manager: 'Nguyễn Hoàng Hưng',
    author: 'Nguyễn Thành Luân',
    users: [
      { name: '', hrm: '', cccd: '', phone: '', dob: '', email: '', title: 'Tổ Khai thác Hệ thống – Kỹ thuật viên', systems: 'Mail eoffice, ONEBSS, APP PHĐB, ĐHVT TNH' }
    ]
  });
  const [isExportingPetition, setIsExportingPetition] = useState(false);

  useEffect(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    setDateInfo({ currentWeek: week, currentYear: d.getUTCFullYear() });
    
    // Auto fill date
    const dStr = String(now.getDate()).padStart(2, '0');
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    setPetitionForm(prev => ({
      ...prev,
      docDate: `ngày ${dStr} tháng ${mStr} năm ${now.getFullYear()}`
    }));
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
    const formData = new FormData();
    formData.append("file", file);
    const uploadToast = toast.loading(`Đang tải lên file ${file.name}...`);
    try {
      const res = await fetch(`/api/reports/${key}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Tải lên thành công!", { id: uploadToast });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(`Lỗi: ${errorData.error || errorData.message}`, { id: uploadToast });
      }
    } catch (e) {
      console.error(e);
      toast.error("Đã xảy ra lỗi khi tải lên.", { id: uploadToast });
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

      const apiRes = await fetch("/api/export-word", { 
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
    } catch (e) {
      console.error(e);
      toast.error("Lỗi mạng khi xuất Word", { id: exportToast });
    }
    setIsExporting(false);
  };

  const handleExportPetition = async () => {
    setIsExportingPetition(true);
    const exportToast = toast.loading("Đang tạo file Đề nghị cấp tài khoản...");
    try {
      const res = await fetch("/api/export-petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petitionForm)
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        a.download = `De_nghi_cap_user_${today}.docx`;
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
    setIsExportingPetition(false);
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

  const handleAddUser = () => {
    setPetitionForm(prev => ({
      ...prev,
      users: [...prev.users, { name: '', hrm: '', cccd: '', phone: '', dob: '', email: '', title: prev.users[0]?.title || '', systems: prev.users[0]?.systems || '' }]
    }));
  };

  const handleRemoveUser = (index: number) => {
    setPetitionForm(prev => ({
      ...prev,
      users: prev.users.filter((_, i) => i !== index)
    }));
  };

  const handleUserChange = (index: number, field: string, value: string) => {
    setPetitionForm(prev => {
      const newUsers = [...prev.users];
      newUsers[index] = { ...newUsers[index], [field]: value };
      return { ...prev, users: newUsers };
    });
  };

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
            <span style={{fontSize: '1.2rem'}}>📊</span> Tổng quan
          </button>
          <div className="nav-item-group">
            <button className={`nav-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
              <span style={{fontSize: '1.2rem'}}>📝</span> Báo cáo hàng tuần
            </button>
            {activeTab === 'details' && cacheData && (
              <div className="submenu fade-in">
                <button className={`submenu-item ${activeReportKey === 'upload' ? 'active' : ''}`} onClick={() => setActiveReportKey('upload')}>
                  📁 Quản lý nguồn dữ liệu
                </button>
                {[...cacheData.data.serviceReports, ...cacheData.data.operationReports].map(report => (
                  <button key={report.id} className={`submenu-item ${activeReportKey === report.id ? 'active' : ''}`} onClick={() => setActiveReportKey(report.id)}>
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={`nav-item ${activeTab === 'special5' ? 'active' : ''}`} onClick={() => setActiveTab('special5')}>
            <span style={{fontSize: '1.2rem'}}>📋</span> Báo cáo chuyên đề 5
          </button>
          <button className={`nav-item ${activeTab === 'petition' ? 'active' : ''}`} onClick={() => setActiveTab('petition')}>
            <span style={{fontSize: '1.2rem'}}>👤</span> Đề nghị cấp tài khoản
          </button>
          <button className={`nav-item ${activeTab === 'handover' ? 'active' : ''}`} onClick={() => setActiveTab('handover')}>
            <span style={{fontSize: '1.2rem'}}>📓</span> Sổ Giao Ca
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
        <header className="dashboard-header">
           <h1 className="header-title">
             {activeTab === 'overview' && 'Tổng quan Hệ thống'}
             {activeTab === 'details' && activeReportKey === 'upload' && 'Quản lý Nguồn Dữ Liệu'}
             {activeTab === 'details' && activeReportKey !== 'upload' && 'Báo cáo hàng tuần'}
             {activeTab === 'special5' && 'Báo cáo chuyên đề 5'}
             {activeTab === 'petition' && 'Đề nghị cấp tài khoản'}
             {activeTab === 'handover' && 'Sổ Giao Ca'}
             {activeTab !== 'petition' && activeTab !== 'handover' && (
               <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: 16, fontWeight: 'normal' }}>
                 (Tuần {dateInfo?.currentWeek || '...'} - Năm {dateInfo?.currentYear || '...'})
               </span>
             )}
           </h1>
           <div className="header-actions">
              {activeTab === 'details' && activeReportKey === 'upload' && (
                 <button className="btn-action btn-outline" onClick={handleProcess} disabled={isProcessing}>
                   {isProcessing ? <Loader2 size={18} className="spin-anim" /> : '🔄'} 
                   {isProcessing ? 'Đang xử lý...' : 'Xử lý lại dữ liệu'}
                 </button>
              )}
              {activeTab === 'petition' ? (
                 <button className="btn-export" onClick={handleExportPetition} disabled={isExportingPetition}>
                   {isExportingPetition ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                   {isExportingPetition ? 'Đang tạo Word...' : 'Xuất Đề nghị (Word)'}
                 </button>
              ) : activeTab === 'handover' ? null : (
                 <button className="btn-export" onClick={handleExportWord} disabled={isExporting || !cacheData}>
                   {isExporting ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                   {isExporting ? 'Đang tạo Word...' : 'Xuất báo cáo Word'}
                 </button>
              )}
              <div className="user-profile">
                 <div className="user-avatar">
                   {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                 </div>
                 <span>{session.user?.name}</span>
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
                          <div className="metric-value">8<span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>/8</span></div>
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
                              <div className="file-input-wrapper">
                                <button className="btn-upload">
                                  {uploadingKey === source.key ? (
                                    <><Loader2 size={18} className="spin-anim" /> Đang tải lên...</>
                                  ) : (
                                    dbSource?.blob_url ? 'Tải file lên mới' : 'Tải file lên'
                                  )}
                                </button>
                                <input type="file" accept=".xlsx" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUpload(source.key, file);
                                }} />
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
                              <h2 className="section-title" style={{ fontSize: '2rem' }}>{report.title}</h2>
                              <p className="section-subtitle" style={{ marginBottom: 24 }}>{report.kicker}</p>
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

           {/* TAB SPECIAL5 */}
           {activeTab === 'special5' && (
             <div className="card-glass" style={{ textAlign: 'center', padding: '100px 0' }}>
               <h2 className="section-title">Báo cáo chuyên đề 5</h2>
               <p className="content-text">Chức năng này đang được phát triển...</p>
             </div>
           )}

           {/* TAB PETITION */}
           {activeTab === 'petition' && (
             <div className="fade-in">
                <div className="card-glass" style={{ padding: '32px 40px', marginBottom: 24 }}>
                  <h2 className="section-title" style={{ marginBottom: 24 }}>Thông tin chung</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số Đề nghị</label>
                      <input type="text" value={petitionForm.docNumber} onChange={e => setPetitionForm(p => ({ ...p, docNumber: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ngày tháng (Ví dụ: ngày 24 tháng 07 năm 2026)</label>
                      <input type="text" value={petitionForm.docDate} onChange={e => setPetitionForm(p => ({ ...p, docDate: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ pháp lý</label>
                      <textarea value={petitionForm.baseClause} onChange={e => setPetitionForm(p => ({ ...p, baseClause: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người Ký duyệt (Lãnh đạo)</label>
                      <input type="text" value={petitionForm.manager} onChange={e => setPetitionForm(p => ({ ...p, manager: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người Đề nghị (Tổ trưởng)</label>
                      <input type="text" value={petitionForm.author} onChange={e => setPetitionForm(p => ({ ...p, author: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                    </div>
                  </div>
                </div>

                <div className="card-glass" style={{ padding: '32px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Danh sách Cấp quyền</h2>
                    <button onClick={handleAddUser} className="btn-action btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                      <Plus size={16} /> Thêm nhân viên
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {petitionForm.users.map((user, index) => (
                      <div key={index} style={{ padding: 24, borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', background: '#f8fafc', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-color)' }}>Nhân viên #{index + 1}</h3>
                          {petitionForm.users.length > 1 && (
                            <button onClick={() => handleRemoveUser(index)} style={{ background: 'transparent', border: 'none', color: 'var(--error-text)', cursor: 'pointer' }}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Họ và tên</label>
                            <input type="text" value={user.name} onChange={e => handleUserChange(index, 'name', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Mã HRM</label>
                            <input type="text" value={user.hrm} onChange={e => handleUserChange(index, 'hrm', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>CCCD</label>
                            <input type="text" value={user.cccd} onChange={e => handleUserChange(index, 'cccd', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Số ĐT</label>
                            <input type="text" value={user.phone} onChange={e => handleUserChange(index, 'phone', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Ngày sinh</label>
                            <input type="text" placeholder="DD/MM/YYYY" value={user.dob} onChange={e => handleUserChange(index, 'dob', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Email</label>
                            <input type="email" value={user.email} onChange={e => handleUserChange(index, 'email', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Tổ / Chức danh</label>
                            <input type="text" value={user.title} onChange={e => handleUserChange(index, 'title', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Hệ thống cần cấp (Ghi chú)</label>
                            <input type="text" value={user.systems} onChange={e => handleUserChange(index, 'systems', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
           )}

           {/* TAB HANDOVER */}
           {activeTab === 'handover' && <ShiftHandover user={session.user} />}
        </div>
      </main>
    </div>
  );
}
