"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { REPORT_SOURCES, type ReportKey } from "@/lib/reports";
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
        // Do not auto-select, let it default to "upload"
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

  const { currentWeek, currentYear } = useMemo(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { currentWeek: week, currentYear: d.getUTCFullYear() };
  }, []);

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
          <div className="nav-item-group">
            <button 
              className={`nav-item ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              📝 Báo cáo hàng tuần
            </button>
            {activeTab === 'details' && cacheData && (
              <div className="submenu">
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
            📋 Báo cáo chuyên đề 5
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
             {activeTab === 'details' && activeReportKey === 'upload' && 'Quản lý Nguồn Dữ Liệu'}
             {activeTab === 'details' && activeReportKey !== 'upload' && 'Báo cáo hàng tuần'}
             {activeTab === 'special5' && 'Báo cáo chuyên đề 5'}
             <span style={{ fontSize: '0.9rem', color: '#6f869b', marginLeft: 12, fontWeight: 'normal' }}>
               (Tuần {currentWeek} - {currentYear})
             </span>
           </h1>
           <div className="header-actions">
              {activeTab === 'details' && activeReportKey === 'upload' && (
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
                    <p>Vui lòng vào Báo cáo hàng tuần -&gt; Quản lý nguồn dữ liệu để tải lên đủ 8 file Excel.</p>
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

                <section className="section" style={{ marginTop: 40, background: '#fff', padding: 30, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div className="section__head" style={{ marginBottom: 20 }}>
                    <h2 style={{ color: '#0b223f' }}>Chức năng và Hướng dẫn sử dụng</h2>
                  </div>
                  <div style={{ color: '#47617d', lineHeight: 1.8 }}>
                    <h3 style={{ color: '#005BAA', marginTop: 15, marginBottom: 10 }}>🌟 Chức năng chính:</h3>
                    <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
                      <li><strong>Tự động tổng hợp dữ liệu:</strong> Đọc và phân tích 8 file Excel báo cáo định kỳ từ các đơn vị.</li>
                      <li><strong>Trực quan hoá thông tin:</strong> Hiển thị các chỉ số, biểu đồ, bảng dữ liệu chi tiết một cách sinh động, dễ nhìn.</li>
                      <li><strong>Xuất báo cáo Word (Docx):</strong> Tạo tự động file Word báo cáo tổng hợp để trình lãnh đạo, giữ nguyên định dạng mẫu và tự điền số liệu.</li>
                    </ul>

                    <h3 style={{ color: '#005BAA', marginTop: 15, marginBottom: 10 }}>📖 Cách sử dụng:</h3>
                    <ol style={{ paddingLeft: 20 }}>
                      <li style={{ marginBottom: 8 }}><strong>Bước 1: Tải lên số liệu:</strong> Mở mục <em>Báo cáo hàng tuần</em> &gt; <em>Quản lý nguồn dữ liệu</em>. Nhấn "Tải file lên" cho từng loại báo cáo tương ứng (MBB, FBB, MyTV,...).</li>
                      <li style={{ marginBottom: 8 }}><strong>Bước 2: Xử lý dữ liệu:</strong> Sau khi tải đủ 8 file, hệ thống sẽ tự động tổng hợp. Bạn cũng có thể nhấn <em>Xử lý lại dữ liệu</em> nếu cần cập nhật thay đổi.</li>
                      <li style={{ marginBottom: 8 }}><strong>Bước 3: Xem báo cáo chi tiết:</strong> Chọn các báo cáo con trong menu <em>Báo cáo hàng tuần</em> để xem chi tiết các chỉ số, phân tích, đánh giá và bảng dữ liệu chuyên sâu.</li>
                      <li style={{ marginBottom: 8 }}><strong>Bước 4: Xuất Word:</strong> Nhấn nút <strong>📄 Xuất báo cáo Word</strong> ở góc trên bên phải trang web để tải xuống file Word hoàn chỉnh.</li>
                    </ol>
                  </div>
                </section>
             </div>
           )}

           {/* TAB DETAILS */}
           {activeTab === 'details' && (
             <div>
               {activeReportKey === 'upload' ? (
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
                                <div style={{ fontSize: '0.85rem', color: '#6f869b', marginTop: 10, marginBottom: 4 }}>
                                  Upload bởi: <strong>{dbSource.uploader_name || 'Hệ thống'}</strong>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6f869b', marginBottom: 12 }}>
                                  Lúc: {new Date(dbSource.uploaded_at).toLocaleString('vi-VN')}
                                </div>
                              </>
                            ) : (
                              <span className="status-badge error">❌ Chưa có dữ liệu</span>
                            )}
                            
                            <div className="file-input-wrapper">
                              <button className="btn-upload">{dbSource?.blob_url ? 'Tải file lên mới' : 'Tải file lên'}</button>
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
                              <a href={dbSource.blob_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: '0.85rem', color: '#005BAA', textDecoration: 'none', fontWeight: 'bold' }}>
                                ⬇️ Tải xuống file Excel
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                 </div>
               ) : (
                  <div>
                    {!cacheData ? (
                      <div style={{ textAlign: 'center', padding: '100px 0', color: '#6f869b' }}>
                        <h2>Chưa có dữ liệu</h2>
                      </div>
                    ) : (
                      <div style={{ background: 'white', padding: 30, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        {(() => {
                          const report = [...cacheData.data.serviceReports, ...cacheData.data.operationReports].find((r: any) => r.id === activeReportKey);
                          if (!report) return (
                            <div style={{ textAlign: 'center', padding: '50px 0', color: '#6f869b' }}>
                              <h3>Vui lòng chọn một báo cáo ở menu bên trái</h3>
                            </div>
                          );
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
                                <div style={{ marginBottom: 30 }}>
                                  <h3 style={{ borderBottom: '2px solid #edf5f9', paddingBottom: 10, marginBottom: 20 }}>Đánh giá & Nhận xét</h3>
                                  <ul style={{ paddingLeft: 20, color: '#47617d', lineHeight: 1.8 }}>
                                    {report.insights.map((ins: string, i: number) => (
                                      <li key={i}>{ins}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.table && report.table.rows && report.table.rows.length > 0 && (
                                <div style={{ marginBottom: 30 }}>
                                  <h3 style={{ borderBottom: '2px solid #edf5f9', paddingBottom: 10, marginBottom: 20 }}>{report.table.title}</h3>
                                  <div style={{ overflowX: 'auto', background: '#f8fbfd', borderRadius: 12, border: '1px solid #dfeef7' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600, fontSize: '0.9rem' }}>
                                      <thead>
                                        <tr style={{ background: '#edf5f9', borderBottom: '2px solid #dfeef7' }}>
                                          {report.table.columns.map((col: string, i: number) => (
                                            <th key={i} style={{ padding: '12px 16px', color: '#0b223f', whiteSpace: 'nowrap' }}>{col}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {report.table.rows.map((row: any, i: number) => (
                                          <tr key={i} style={{ borderBottom: '1px solid #edf5f9' }}>
                                            {report.table.columns.map((col: string, j: number) => (
                                              <td key={j} style={{ padding: '10px 16px', color: '#47617d' }}>{row[col]}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {report.list && report.list.items && report.list.items.length > 0 && (
                                <div style={{ marginBottom: 30 }}>
                                  <h3 style={{ borderBottom: '2px solid #edf5f9', paddingBottom: 10, marginBottom: 20 }}>{report.list.title}</h3>
                                  <ul style={{ paddingLeft: 20, color: '#47617d', lineHeight: 1.8 }}>
                                    {report.list.items.map((item: string, i: number) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.raw && Object.keys(report.raw).length > 0 && (
                                <div style={{ marginTop: 40 }}>
                                  <h3 style={{ borderBottom: '2px solid #edf5f9', paddingBottom: 10, marginBottom: 20, color: '#005BAA' }}>
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
                                        <details key={key} style={{ marginBottom: 15, background: '#fff', border: '1px solid #dfeef7', borderRadius: 8, padding: '10px 16px' }}>
                                          <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: '#0b223f', textTransform: 'capitalize' }}>
                                            Bảng: {key} ({rows.length} dòng)
                                          </summary>
                                          <div style={{ overflowX: 'auto', marginTop: 15 }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600, fontSize: '0.85rem' }}>
                                              <thead>
                                                <tr style={{ background: '#f8fbfd', borderBottom: '1px solid #dfeef7' }}>
                                                  {columns.map((col: string, i: number) => (
                                                    <th key={i} style={{ padding: '8px 12px', color: '#0b223f', whiteSpace: 'nowrap' }}>{col}</th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {rows.map((row: any, i: number) => (
                                                  <tr key={i} style={{ borderBottom: '1px solid #edf5f9' }}>
                                                    {columns.map((col: string, j: number) => (
                                                      <td key={j} style={{ padding: '8px 12px', color: '#47617d' }}>{String(row[col])}</td>
                                                    ))}
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </details>
                                      );
                                    })
                                  }
                                </div>
                              )}
                            </>
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
             <div style={{ textAlign: 'center', padding: '100px 0', color: '#6f869b' }}>
               <h2>Báo cáo chuyên đề 5</h2>
               <p>Chức năng này đang được phát triển...</p>
             </div>
           )}

        </div>
      </main>
    </div>
  );
}
