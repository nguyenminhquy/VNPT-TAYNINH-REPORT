"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { REPORT_SOURCES, type ReportKey } from "@/lib/reports";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import "./dashboard.css";
import VnptLogo from "@/components/VnptLogo";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reportSources, setReportSources] = useState<any[]>([]);
  const [cacheData, setCacheData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "special5">("overview");
  const [activeReportKey, setActiveReportKey] = useState<string | null>("upload");
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState<{currentWeek: number; currentYear: number} | null>(null);

  useEffect(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    setDateInfo({ currentWeek: week, currentYear: d.getUTCFullYear() });
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
        body: JSON.stringify({
          blobUrls: blobUrls
        })
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
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span style={{fontSize: '1.2rem'}}>📊</span> Tổng quan
          </button>
          <div className="nav-item-group">
            <button 
              className={`nav-item ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <span style={{fontSize: '1.2rem'}}>📝</span> Báo cáo hàng tuần
            </button>
            {activeTab === 'details' && cacheData && (
              <div className="submenu fade-in">
                <button
                  className={`submenu-item ${activeReportKey === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveReportKey('upload')}
                >
                  📁 Quản lý nguồn dữ liệu
                </button>
                {[...cacheData.data.serviceReports, ...cacheData.data.operationReports].map(report => (
                  <button 
                    key={report.id}
                    className={`submenu-item ${activeReportKey === report.id ? 'active' : ''}`}
                    onClick={() => setActiveReportKey(report.id)}
                  >
                    {report.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            className={`nav-item ${activeTab === 'special5' ? 'active' : ''}`}
            onClick={() => setActiveTab('special5')}
          >
            <span style={{fontSize: '1.2rem'}}>📋</span> Báo cáo chuyên đề 5
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
             <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: 16, fontWeight: 'normal' }}>
               (Tuần {dateInfo?.currentWeek || '...'} - Năm {dateInfo?.currentYear || '...'})
             </span>
           </h1>
           <div className="header-actions">
              {activeTab === 'details' && activeReportKey === 'upload' && (
                 <button className="btn-action btn-outline" onClick={handleProcess} disabled={isProcessing}>
                   {isProcessing ? <Loader2 size={18} className="spin-anim" /> : '🔄'} 
                   {isProcessing ? 'Đang xử lý...' : 'Xử lý lại dữ liệu'}
                 </button>
              )}
              <button 
                className="btn-export" 
                onClick={handleExportWord} 
                disabled={isExporting || !cacheData}
              >
                {isExporting ? <Loader2 size={18} className="spin-anim" /> : '📄'} 
                {isExporting ? 'Đang tạo Word...' : 'Xuất báo cáo Word'}
              </button>
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

                <section className="card-glass" style={{ marginTop: 40 }}>
                  <h2 className="section-title">Chức năng & Hướng dẫn sử dụng</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 30 }}>
                    <div>
                      <h3 className="section-subtitle">🌟 Chức năng chính</h3>
                      <ul style={{ paddingLeft: 20 }} className="content-text">
                        <li style={{ marginBottom: 12 }}><strong>Tự động tổng hợp dữ liệu:</strong> Đọc và phân tích 8 file Excel báo cáo định kỳ.</li>
                        <li style={{ marginBottom: 12 }}><strong>Trực quan hoá thông tin:</strong> Hiển thị biểu đồ, bảng dữ liệu sinh động, dễ nhìn.</li>
                        <li style={{ marginBottom: 12 }}><strong>Xuất báo cáo Word:</strong> Tạo file Word tự động theo biểu mẫu chuẩn xác 100%.</li>
                      </ul>
                    </div>
                    
                    <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16 }}>
                      <h3 className="section-subtitle">📖 Cách sử dụng</h3>
                      <ol style={{ paddingLeft: 20, margin: 0 }} className="content-text">
                        <li style={{ marginBottom: 12 }}><strong>Tải lên số liệu:</strong> Mở mục <em>Báo cáo hàng tuần &gt; Quản lý nguồn dữ liệu</em>.</li>
                        <li style={{ marginBottom: 12 }}><strong>Xử lý dữ liệu:</strong> Hệ thống tự tổng hợp khi đủ 8 file. Bạn cũng có thể bấm thủ công.</li>
                        <li style={{ marginBottom: 12 }}><strong>Xem chi tiết:</strong> Chọn các báo cáo con trong menu để xem phân tích.</li>
                        <li style={{ marginBottom: 12 }}><strong>Xuất Word:</strong> Nhấn nút "Xuất báo cáo Word" góc phải trên.</li>
                      </ol>
                    </div>
                  </div>
                </section>
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
                                  <span className="status-badge success">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Đã có dữ liệu
                                  </span>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                    <div>Tải lên bởi: <strong>{dbSource.uploader_name || 'Hệ thống'}</strong></div>
                                    <div>Lúc: {new Date(dbSource.uploaded_at).toLocaleString('vi-VN')}</div>
                                  </div>
                                </>
                              ) : (
                                <span className="status-badge error">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                  Chưa có dữ liệu
                                </span>
                              )}
                              
                              <div className="file-input-wrapper">
                                <button className="btn-upload">
                                  {uploadingKey === source.key ? (
                                    <><Loader2 size={18} className="spin-anim" /> Đang tải lên...</>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                      {dbSource?.blob_url ? 'Tải file lên mới' : 'Tải file lên'}
                                    </>
                                  )}
                                </button>
                                <input 
                                  type="file" 
                                  accept=".xlsx" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(source.key, file);
                                  }}
                                />
                              </div>
                              
                              {dbSource?.blob_url && (
                                <a href={dbSource.blob_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: '0.9rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                                  Tải xuống file Excel &darr;
                                </a>
                              )}
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
                          if (!report) return (
                            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                              <h3>Vui lòng chọn một báo cáo ở menu bên trái</h3>
                            </div>
                          );
                          return (
                            <div className="fade-in">
                              <h2 className="section-title" style={{ fontSize: '2rem' }}>{report.title}</h2>
                              <p className="section-subtitle" style={{ marginBottom: 24 }}>{report.kicker}</p>
                              
                              <p className="content-text" style={{ fontSize: '1.1rem', marginBottom: 40 }}>{report.summary}</p>
                              
                              <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 24 }}>Chỉ số chi tiết</h3>
                              <div className="metrics-grid">
                                {report.metrics.map((m: any, i: number) => (
                                  <div key={i} className="metric-card" style={{ background: '#f8fafc' }}>
                                    <div className="metric-label">{m.label}</div>
                                    <div className="metric-value" style={{ color: 'var(--primary-color)' }}>{m.value}</div>
                                  </div>
                                ))}
                              </div>

                              {report.insights.length > 0 && (
                                <div style={{ marginBottom: 48 }}>
                                  <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 20 }}>Đánh giá & Nhận xét</h3>
                                  <ul className="content-text" style={{ paddingLeft: 20 }}>
                                    {report.insights.map((ins: string, i: number) => (
                                      <li key={i} style={{ marginBottom: 12 }}>{ins}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.table && report.table.rows && report.table.rows.length > 0 && (
                                <div style={{ marginBottom: 48 }}>
                                  <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 20 }}>{report.table.title}</h3>
                                  <div className="table-container">
                                    <table className="data-table">
                                      <thead>
                                        <tr>
                                          {report.table.columns.map((col: string, i: number) => (
                                            <th key={i}>{col}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {report.table.rows.map((row: any, i: number) => (
                                          <tr key={i}>
                                            {report.table.columns.map((col: string, j: number) => (
                                              <td key={j}>{row[col]}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {report.list && report.list.items && report.list.items.length > 0 && (
                                <div style={{ marginBottom: 48 }}>
                                  <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 20 }}>{report.list.title}</h3>
                                  <ul className="content-text" style={{ paddingLeft: 20 }}>
                                    {report.list.items.map((item: string, i: number) => (
                                      <li key={i} style={{ marginBottom: 8 }}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.raw && Object.keys(report.raw).length > 0 && (
                                <div style={{ marginTop: 64 }}>
                                  <h3 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 24, color: 'var(--primary-color)' }}>
                                    Dữ liệu chi tiết từ Excel
                                  </h3>
                                  {Object.keys(report.raw)
                                    .filter(key => Array.isArray(report.raw[key]) && report.raw[key].length > 0)
                                    .map(key => {
                                      const rows = report.raw[key];
                                      const isTableValid = rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null && Object.keys(rows[0]).length > 0;
                                      if (!isTableValid) return null;
                                      
                                      const columns = Object.keys(rows[0]);
                                      return (
                                        <details key={key} className="details-box">
                                          <summary className="details-summary">
                                            Bảng: {key} <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontWeight: 'normal' }}>({rows.length} dòng)</span>
                                          </summary>
                                          <div className="details-content">
                                            <div className="table-container" style={{ marginTop: 24, marginBottom: 0, boxShadow: 'none', border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                                              <table className="data-table">
                                                <thead>
                                                  <tr>
                                                    {columns.map((col: string, i: number) => (
                                                      <th key={i}>{col}</th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {rows.map((row: any, i: number) => (
                                                    <tr key={i}>
                                                      {columns.map((col: string, j: number) => (
                                                        <td key={j}>{String(row[col])}</td>
                                                      ))}
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </details>
                                      );
                                    })
                                  }
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

        </div>
      </main>
    </div>
  );
}
