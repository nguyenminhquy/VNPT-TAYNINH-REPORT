"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_SOURCES, type ReportKey } from "@/lib/reports";
import "./dashboard.css";
import VnptLogo from "@/components/VnptLogo";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reportSources, setReportSources] = useState<any[]>([]);
  const [cacheData, setCacheData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "details">("overview");
  const [activeReportKey, setActiveReportKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (res.ok) {
        setReportSources(json.sources);
        setCacheData(json.cache);
        if (json.cache?.data?.serviceReports?.length > 0) {
           setActiveReportKey(json.cache.data.serviceReports[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpload = async (key: ReportKey, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/reports/${key}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Tải lên thành công!");
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error || errorData.message}`);
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi tải lên.");
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      // 1. Lấy blobUrls từ state reportSources
      const blobUrls: Record<string, string> = {};
      for (const row of reportSources) {
        if (row.blob_url) {
          blobUrls[row.key] = row.blob_url;
        }
      }
      
      if (Object.keys(blobUrls).length < 8) {
        alert("Chưa đủ 8 file Excel. Vui lòng tải lên đầy đủ.");
        setIsExporting(false);
        return;
      }

      // 2. Gọi Javascript API để xử lý file Word
      const apiRes = await fetch("/api/export-word", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrls: blobUrls
        })
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        alert(`Lỗi JS API (${apiRes.status}): ${errText}`);
        setIsExporting(false);
        return;
      }

      const wordBlob = await apiRes.blob();

      // 3. Gọi Next.js API để lưu file vào Vercel Blob & lịch sử Supabase
      const formData = new FormData();
      formData.append("file", wordBlob, "report.docx");

      const saveRes = await fetch("/api/export-word-save", {
        method: "POST",
        body: formData
      });

      const json = await saveRes.json();
      if (saveRes.ok && json.blobUrl) {
        window.open(json.blobUrl, "_blank");
      } else {
        alert(json.error || "Lỗi khi lưu file Word");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi mạng khi xuất Word");
    }
    setIsExporting(false);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/reports/process", { method: "POST" });
      if (res.ok) {
        alert("Đã xử lý lại dữ liệu thành công");
        fetchData();
      } else {
        alert("Lỗi khi xử lý dữ liệu");
      }
    } catch (e) {
      alert("Lỗi mạng khi xử lý");
    }
    setIsProcessing(false);
  };

  if (loading || status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7fb' }}>
        <div style={{ textAlign: 'center' }}>
           <VnptLogo style={{ width: 150, marginBottom: 20 }} />
           <p style={{ color: '#005BAA', fontWeight: 'bold' }}>Đang tải dữ liệu...</p>
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
            📊 Tổng quan
          </button>
          <button 
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📁 Nguồn dữ liệu
          </button>
          <button 
            className={`nav-item ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📝 Chi tiết báo cáo
          </button>
        </nav>
        <div className="sidebar-footer">
           <button className="btn-logout" onClick={() => signOut()}>Đăng xuất</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <header className="dashboard-header">
           <h1 className="header-title">
             {activeTab === 'overview' && 'Tổng quan Hệ thống'}
             {activeTab === 'upload' && 'Quản lý Nguồn Dữ Liệu'}
             {activeTab === 'details' && 'Chi tiết Báo cáo'}
           </h1>
           <div className="header-actions">
              {activeTab === 'upload' && (
                 <button onClick={handleProcess} disabled={isProcessing} style={{ padding: '10px 20px', borderRadius: 99, border: '1px solid #005BAA', background: 'transparent', color: '#005BAA', fontWeight: 'bold', cursor: 'pointer' }}>
                   {isProcessing ? 'Đang xử lý...' : '🔄 Xử lý lại dữ liệu'}
                 </button>
              )}
              <button 
                className="btn-export" 
                onClick={handleExportWord} 
                disabled={isExporting || !cacheData}
              >
                {isExporting ? "⏳ Đang tạo Word..." : "📄 Xuất báo cáo Word"}
              </button>
              <div className="user-profile">
                 <div className="user-avatar">
                   {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                 </div>
                 <span>{session.user?.name}</span>
              </div>
           </div>
        </header>

        <div className="dashboard-content">
           {/* TAB OVERVIEW */}
           {activeTab === 'overview' && (
             <div>
                {!cacheData ? (
                  <div style={{ textAlign: 'center', padding: '100px 0', color: '#6f869b' }}>
                    <h2>Chưa có dữ liệu</h2>
                    <p>Vui lòng vào tab "Nguồn dữ liệu" để tải lên đủ 8 file Excel.</p>
                  </div>
                ) : (
                  <>
                    <section className="hero">
                      <div className="hero__grid">
                        <div className="hero__copy">
                          <p className="eyebrow">{cacheData.data.hero.kicker}</p>
                          <h1>{cacheData.data.hero.title}</h1>
                        </div>
                        <div className="hero-board">
                          <div className="hero-board__head">
                            <h2>Chỉ số quan trọng</h2>
                          </div>
                          <div className="stat-grid">
                            <div className="stat-card">
                              <span className="stat-card__label">Tổng nguồn</span>
                              <span className="stat-card__value">8/8</span>
                            </div>
                            <div className="stat-card">
                              <span className="stat-card__label">Cập nhật lúc</span>
                              <span className="stat-card__value" style={{fontSize: '1rem'}}>{new Date(cacheData.generated_at).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="section" style={{ marginTop: 40 }}>
                      <div className="section__head">
                        <h2>Tổng quan tín hiệu</h2>
                      </div>
                      <div className="signal-grid">
                        {cacheData.data.signalBands.map((band: any, i: number) => (
                          <div key={i} className={`signal-card tone-${band.tone}`}>
                            <div className="signal-card__label">{band.label}</div>
                            <div className="signal-card__value">{band.value}</div>
                            <div className="signal-card__note">{band.note}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
             </div>
           )}

           {/* TAB UPLOAD */}
           {activeTab === 'upload' && (
             <div className="upload-grid">
                {REPORT_SOURCES.map((source) => {
                  const dbSource = reportSources.find((s) => s.key === source.key);
                  return (
                    <div key={source.key} className="upload-card">
                      <div className="upload-card-header">
                        <div className="upload-card-title">{source.label}</div>
                        <div className="upload-card-subtitle">{source.filename}</div>
                        <div className="upload-card-subtitle" style={{ marginTop: 4 }}>Phụ trách: <strong>{source.owner}</strong></div>
                      </div>
                      
                      <div className="upload-card-status">
                        {dbSource?.blob_url ? (
                          <>
                            <span className="status-badge success">✅ Đã có dữ liệu</span>
                            <div style={{ fontSize: '0.8rem', color: '#6f869b', marginBottom: 12 }}>
                              Upload lúc: {new Date(dbSource.uploaded_at).toLocaleString('vi-VN')}
                            </div>
                          </>
                        ) : (
                          <span className="status-badge error">❌ Chưa có dữ liệu</span>
                        )}
                        
                        <div className="file-input-wrapper">
                          <button className="btn-upload">Tải file lên</button>
                          <input 
                            type="file" 
                            accept=".xlsx" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(source.key, file);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
           )}

           {/* TAB DETAILS */}
           {activeTab === 'details' && (
             <div>
                {!cacheData ? (
                  <div style={{ textAlign: 'center', padding: '100px 0', color: '#6f869b' }}>
                    <h2>Chưa có dữ liệu</h2>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 30 }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...cacheData.data.serviceReports, ...cacheData.data.operationReports].map(report => (
                          <button 
                            key={report.id} 
                            onClick={() => setActiveReportKey(report.id)}
                            style={{ 
                              padding: '12px 16px', 
                              textAlign: 'left', 
                              borderRadius: 8, 
                              border: 'none',
                              background: activeReportKey === report.id ? '#005BAA' : 'white',
                              color: activeReportKey === report.id ? 'white' : '#0b223f',
                              fontWeight: activeReportKey === report.id ? 'bold' : 'normal',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                          >
                            {report.title}
                          </button>
                        ))}
                     </div>
                     
                     <div style={{ background: 'white', padding: 30, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        {(() => {
                          const report = [...cacheData.data.serviceReports, ...cacheData.data.operationReports].find((r: any) => r.id === activeReportKey);
                          if (!report) return null;
                          return (
                            <>
                              <h2 style={{ marginTop: 0, marginBottom: 8, color: '#0b223f' }}>{report.title}</h2>
                              <p style={{ color: '#005BAA', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 20 }}>{report.kicker}</p>
                              
                              <p style={{ color: '#47617d', lineHeight: 1.6, marginBottom: 30 }}>{report.summary}</p>
                              
                              <h3 style={{ borderBottom: '2px solid #edf5f9', paddingBottom: 10, marginBottom: 20 }}>Chỉ số chi tiết</h3>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
                                {report.metrics.map((m: any, i: number) => (
                                  <div key={i} style={{ background: '#f8fbfd', padding: 16, borderRadius: 12, border: '1px solid #dfeef7' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#6f869b', marginBottom: 8 }}>{m.label}</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0b223f' }}>{m.value}</div>
                                  </div>
                                ))}
                              </div>

                              {report.insights.length > 0 && (
                                <>
                                  <h3 style={{ borderBottom: '2px solid #edf5f9', paddingBottom: 10, marginBottom: 20 }}>Đánh giá & Nhận xét</h3>
                                  <ul style={{ paddingLeft: 20, color: '#47617d', lineHeight: 1.8 }}>
                                    {report.insights.map((ins: string, i: number) => (
                                      <li key={i}>{ins}</li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </>
                          )
                        })()}
                     </div>
                  </div>
                )}
             </div>
           )}

        </div>
      </main>
    </div>
  );
}
