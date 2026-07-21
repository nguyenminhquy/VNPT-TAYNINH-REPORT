"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_SOURCES, type ReportKey } from "@/lib/reports";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reportSources, setReportSources] = useState<any[]>([]);
  const [cacheData, setCacheData] = useState<any>(null);
  const [activeReportKey, setActiveReportKey] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
        // By default, select the first report if data exists
        if (json.cache?.data?.serviceReports?.length > 0) {
           setActiveReportKey(json.cache.data.serviceReports[0].id);
        } else if (json.cache?.data?.operationReports?.length > 0) {
           setActiveReportKey(json.cache.data.operationReports[0].id);
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
      const res = await fetch("/api/export-word", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.blobUrl) {
        window.open(json.blobUrl, "_blank");
      } else {
        alert(json.error || "Lỗi khi xuất Word");
      }
    } catch (e) {
      alert("Lỗi mạng khi xuất Word");
    }
    setIsExporting(false);
  };

  const handleProcess = async () => {
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
  };

  if (loading || status === "loading") {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  }

  if (!session) return null;

  return (
    <div className="page-shell">
      <header className="masthead">
        <div className="masthead__inner">
          <div className="brand">
            <span className="brand__text" style={{fontSize: '1.2rem', color: '#005BAA'}}>VNPT TÂY NINH</span>
          </div>
          <div className="masthead__links">
            <button className="button button--secondary" onClick={() => setIsUploadOpen(!isUploadOpen)}>
              Nguồn dữ liệu
            </button>
            <button className="button button--secondary" onClick={handleProcess}>
              Xử lý lại dữ liệu
            </button>
          </div>
          <div className="masthead__status">
            <span className="status-pill status-pill--muted">
              {session.user?.name}
            </span>
            <button className="button button--secondary" onClick={() => signOut()}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: isUploadOpen ? '280px 1fr' : '1fr', padding: '24px' }}>
        
        {isUploadOpen && (
          <aside className="report-sidebar" style={{ borderRight: '1px solid #ccc', paddingRight: '20px' }}>
            <h3>Upload Nguồn Dữ Liệu</h3>
            <div className="source-list">
              {REPORT_SOURCES.map((source) => {
                const dbSource = reportSources.find((s) => s.key === source.key);
                return (
                  <div key={source.key} className="source-card" style={{ padding: 12, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8 }}>
                    <div style={{ fontWeight: 'bold' }}>{source.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{source.filename}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>Owner: {source.owner}</div>
                    
                    {dbSource?.blob_url ? (
                      <div style={{ fontSize: '0.8rem', color: 'green', marginBottom: 8 }}>
                        Đã upload: {new Date(dbSource.uploaded_at).toLocaleString()}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'red', marginBottom: 8 }}>Chưa có dữ liệu</div>
                    )}
                    
                    <input 
                      type="file" 
                      accept=".xlsx" 
                      style={{ fontSize: '0.8rem' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(source.key, file);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        <div className="dashboard-canvas">
          {!cacheData ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
              <h2>Chưa có dữ liệu</h2>
              <p>Vui lòng upload đủ 8 file Excel ở mục "Nguồn dữ liệu" để hệ thống tự động tổng hợp.</p>
            </div>
          ) : (
            <>
              <section id="top" className="hero">
                <div className="hero__grid">
                  <div className="hero__copy">
                    <p className="eyebrow">{cacheData.data.hero.kicker}</p>
                    <h1>{cacheData.data.hero.title}</h1>
                    <div className="hero__actions">
                      <button className="button button--primary" onClick={handleExportWord} disabled={isExporting}>
                        {isExporting ? "Đang tạo Word..." : "Xuất báo cáo Word"}
                      </button>
                    </div>
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
                        <span className="stat-card__value" style={{fontSize: '1.2rem'}}>{new Date(cacheData.generated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <main className="main-content">
                <section id="overview" className="section">
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

                <section id="actions" className="section">
                  <div className="section__head">
                    <h2>Hành động trọng tâm</h2>
                  </div>
                  <div className="action-grid">
                    {cacheData.data.actionItems.map((item: any, i: number) => (
                      <div key={i} className={`action-card tone-${item.tone}`} style={{ padding: 16 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: '0.9rem', color: '#444' }}>{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section id="reports" className="section">
                  <div className="section__head">
                    <h2>Chi tiết các báo cáo</h2>
                  </div>
                  <div className="quick-nav" style={{ marginBottom: 20 }}>
                    {[...cacheData.data.serviceReports, ...cacheData.data.operationReports].map(report => (
                      <button 
                        key={report.id} 
                        className="quick-nav__link"
                        style={{ textAlign: 'left', border: activeReportKey === report.id ? '2px solid #005BAA' : undefined }}
                        onClick={() => setActiveReportKey(report.id)}
                      >
                        <span className="quick-nav__label">{report.title}</span>
                      </button>
                    ))}
                  </div>

                  {activeReportKey && (
                    <div className="report-detail" style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                      {(() => {
                        const report = [...cacheData.data.serviceReports, ...cacheData.data.operationReports].find((r: any) => r.id === activeReportKey);
                        if (!report) return null;
                        return (
                          <>
                            <h3 style={{ margin: '0 0 8px 0' }}>{report.title} <span style={{fontSize: '0.8rem', color: '#666', fontWeight: 'normal'}}>— {report.kicker}</span></h3>
                            <p style={{ margin: '0 0 20px 0', color: '#444' }}>{report.summary}</p>
                            
                            <h4>Chỉ số</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                              {report.metrics.map((m: any, i: number) => (
                                <div key={i} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{m.label}</div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.value}</div>
                                </div>
                              ))}
                            </div>

                            {report.insights.length > 0 && (
                              <>
                                <h4>Đánh giá</h4>
                                <ul style={{ marginBottom: 20, paddingLeft: 20 }}>
                                  {report.insights.map((ins: string, i: number) => (
                                    <li key={i} style={{ marginBottom: 6 }}>{ins}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </section>
                
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
