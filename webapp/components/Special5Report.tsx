'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, Play, Download, CheckCircle, 
  AlertTriangle, Clock, Users, RefreshCw, FileText, 
  BarChart2, Layers, AlertCircle, Sparkles, Check 
} from 'lucide-react';

export default function Special5Report() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [subTab, setSubTab] = useState<'overview' | 'mane' | 'access' | 'votuyen' | 'overdue' | 'email'>('overview');
  const [useSample, setUseSample] = useState(false);

  // Thử tải dữ liệu kết quả gần nhất nếu có
  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const res = await fetch('/api/cd5/result');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (e) {
      // bỏ qua nếu chưa có
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      setUseSample(false);
      setError(null);
    }
  };

  const handleProcess = async (sample: boolean = false) => {
    setError(null);
    setProcessing(true);
    setUseSample(sample);

    try {
      // 1. Nếu không dùng mẫu thì phải upload file trước
      if (!sample) {
        if (!selectedFiles || selectedFiles.length === 0) {
          throw new Error('Vui lòng chọn 06 file Excel đầu vào trước khi xử lý!');
        }
        setUploading(true);
        const formData = new FormData();
        Array.from(selectedFiles).forEach(file => {
          formData.append('files', file);
        });

        const upRes = await fetch('/api/cd5/upload', {
          method: 'POST',
          body: formData
        });
        const upJson = await upRes.json();
        setUploading(false);

        if (!upJson.success) {
          throw new Error(upJson.error || 'Lỗi khi tải file lên máy chủ.');
        }
      }

      // 2. Gọi API xử lý dữ liệu và tạo báo cáo
      const procRes = await fetch('/api/cd5/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_sample: sample })
      });
      const procJson = await procRes.json();

      if (!procJson.success) {
        throw new Error(procJson.error || 'Lỗi trong quá trình tính toán và tạo báo cáo Excel.');
      }

      setData(procJson.data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    window.location.href = '/api/cd5/download';
  };

  const renderStatTable = (tableData: any[], title: string, color: string) => {
    if (!tableData || tableData.length === 0) return <p>Không có dữ liệu</p>;
    return (
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <h3 style={{ color: color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSpreadsheet size={20} /> {title}
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ background: color, color: '#fff', textAlign: 'center', fontSize: '0.9rem' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tổ Hạ tầng</th>
              <th style={{ padding: '12px 8px' }}>Tổng giao</th>
              <th style={{ padding: '12px 8px' }}>Hoàn thành</th>
              <th style={{ padding: '12px 8px' }}>HT đúng hạn</th>
              <th style={{ padding: '12px 8px' }}>HT quá hạn</th>
              <th style={{ padding: '12px 8px' }}>TL HT đúng hạn</th>
              <th style={{ padding: '12px 8px' }}>Tổng tồn</th>
              <th style={{ padding: '12px 8px' }}>Tồn trong hạn</th>
              <th style={{ padding: '12px 8px' }}>Tồn quá hạn</th>
              <th style={{ padding: '12px 8px' }}>TL tồn QH</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => {
              const isTot = row['Tổ Hạ tầng'] === 'TỔNG';
              return (
                <tr 
                  key={idx} 
                  style={{ 
                    background: isTot ? '#D6E4F0' : (idx % 2 === 0 ? '#EBF3FB' : '#FFFFFF'),
                    fontWeight: isTot ? 700 : 400,
                    borderBottom: '1px solid #eee',
                    textAlign: 'center',
                    fontSize: '0.95rem'
                  }}
                >
                  <td style={{ padding: '10px 16px', textAlign: 'left', color: '#1F3864' }}>{row['Tổ Hạ tầng']}</td>
                  <td style={{ padding: '10px 8px' }}>{row['Tổng giao']}</td>
                  <td style={{ padding: '10px 8px', color: '#375623', fontWeight: 600 }}>{row['Hoàn thành']}</td>
                  <td style={{ padding: '10px 8px', color: '#375623' }}>{row['HT đúng hạn']}</td>
                  <td style={{ padding: '10px 8px', color: row['HT quá hạn'] > 0 && !isTot ? '#C00000' : 'inherit', fontWeight: row['HT quá hạn'] > 0 ? 600 : 400 }}>{row['HT quá hạn']}</td>
                  <td style={{ padding: '10px 8px', color: '#2E75B6', fontWeight: 600 }}>{row['Tỉ lệ HT đúng hạn']}%</td>
                  <td style={{ padding: '10px 8px' }}>{row['Tổng tồn']}</td>
                  <td style={{ padding: '10px 8px', color: '#375623' }}>{row['Tồn trong hạn']}</td>
                  <td style={{ padding: '10px 8px', color: row['Tồn quá hạn'] > 0 && !isTot ? '#C00000' : 'inherit', fontWeight: row['Tồn quá hạn'] > 0 ? 600 : 400 }}>{row['Tồn quá hạn']}</td>
                  <td style={{ padding: '10px 8px', color: row['Tỉ lệ tồn QH'] > 0 ? '#C00000' : '#375623', fontWeight: 600 }}>{row['Tỉ lệ tồn QH']}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* HEADER BANNER */}
      <div className="card-glass" style={{ padding: '32px 40px', marginBottom: 24, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Sparkles className="animate-spin" size={28} style={{ color: '#ffd700' }} />
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>BÁO CÁO CHUYÊN ĐỀ 5</h1>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1.05rem' }}>
              Hệ thống Web App thay thế tự động hóa quy trình xử lý sự cố &amp; tính toán KPI Tây Ninh
            </p>
          </div>
          {data && (
            <button 
              onClick={handleDownload} 
              className="btn-action" 
              style={{ 
                background: '#22c55e', color: '#fff', padding: '12px 24px', fontSize: '1.05rem', 
                fontWeight: 700, borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Download size={20} /> TẢI XUỐNG EXCEL BÁO CÁO CĐ5
            </button>
          )}
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '16px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={24} />
          <div>
            <strong style={{ display: 'block' }}>Có lỗi xảy ra:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* UPLOAD & PROCESS CONTROL PANEL */}
      <div className="card-glass" style={{ padding: '28px 36px', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Upload size={22} /> Nhập liệu &amp; Thực thi Báo cáo
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>
              Chọn 06 File Excel đầu vào (Tiến trình Vô tuyến, ACCESS, MANE, XLSC Chi tiết CĐ5, XLSC Vô tuyến, export.xlsx):
            </label>
            <input 
              type="file" 
              multiple 
              accept=".xls,.xlsx" 
              onChange={handleFileChange} 
              disabled={processing}
              style={{ 
                width: '100%', padding: '12px', background: '#f8fafc', border: '2px dashed #cbd5e1', 
                borderRadius: 10, cursor: 'pointer' 
              }} 
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={16} /> Đã chọn <strong>{selectedFiles.length} file</strong> sẵn sàng tải lên.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              onClick={() => handleProcess(false)} 
              disabled={processing || (!selectedFiles && !data)}
              className="btn-action" 
              style={{ 
                background: 'var(--primary-color)', color: '#fff', padding: '12px 24px', fontWeight: 600,
                borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer'
              }}
            >
              {processing && !useSample ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
              {processing && !useSample ? 'Đang xử lý...' : '⚡ Xử lý File Upload'}
            </button>

            <button 
              onClick={() => handleProcess(true)} 
              disabled={processing}
              style={{ 
                background: '#f1f5f9', color: '#334155', padding: '10px 18px', fontWeight: 600, fontSize: '0.9rem',
                borderRadius: 10, border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
              }}
            >
              {processing && useSample ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} color="#eab308" />}
              Dùng Dữ liệu Mẫu TTS để Thử nghiệm
            </button>
          </div>
        </div>

        {/* PROCESSING INDICATOR */}
        {processing && (
          <div style={{ marginTop: 20, padding: 16, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16 }}>
            <RefreshCw className="animate-spin" size={24} color="#2563eb" />
            <div>
              <strong style={{ color: '#1e40af', display: 'block' }}>Hệ thống đang thực hiện tính toán...</strong>
              <span style={{ fontSize: '0.9rem', color: '#3b82f6' }}>Đọc dữ liệu Excel &rarr; Mapping Tổ Hạ tầng &rarr; Tính toán KPI MANE, ACCESS, VT &rarr; Sinh báo cáo chuẩn openpyxl.</span>
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD KẾT QUẢ */}
      {data && (
        <div>
          {/* META INFO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#f8fafc', padding: '12px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Thời gian báo cáo: </span>
              <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{data.meta.date_label}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Cập nhật lần cuối: </span>
              <strong style={{ color: '#0f172a' }}>{new Date(data.meta.generated_at).toLocaleTimeString('vi-VN')} {new Date(data.meta.generated_at).toLocaleDateString('vi-VN')}</strong>
            </div>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #2E75B6' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>TỔNG GIAO</span>
              <strong style={{ fontSize: '1.8rem', color: '#1F3864' }}>{data.summary.total_giao}</strong>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #375623' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>HOÀN THÀNH</span>
              <strong style={{ fontSize: '1.8rem', color: '#375623' }}>{data.summary.total_ht}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#16a34a', marginTop: 4 }}>Đúng hạn: {data.summary.total_ht_dh}</span>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #2563eb' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>TL HT ĐÚNG HẠN</span>
              <strong style={{ fontSize: '1.8rem', color: '#2563eb' }}>{data.summary.rate_ht_dh}%</strong>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>TỔNG TỒN</span>
              <strong style={{ fontSize: '1.8rem', color: '#d97706' }}>{data.summary.total_ton}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Trong hạn: {data.summary.total_ton_th}</span>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #dc2626' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>TỒN QUÁ HẠN</span>
              <strong style={{ fontSize: '1.8rem', color: '#dc2626' }}>{data.summary.total_ton_qh}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#dc2626', marginTop: 4 }}>TL: {data.summary.rate_ton_qh}%</span>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #7b0000', background: '#fff5f5' }}>
              <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>PHIẾU QUÁ HẠN TT</span>
              <strong style={{ fontSize: '1.8rem', color: '#7b0000' }}>{data.summary.overdue_count}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#991b1b', marginTop: 4 }}>Cần xử lý gấp</span>
            </div>
          </div>

          {/* SUB NAVIGATION TABS */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 24, overflowX: 'auto' }}>
            <button 
              onClick={() => setSubTab('overview')} 
              style={{ 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'overview' ? '#1F3864' : 'transparent',
                color: subTab === 'overview' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              📊 Tổng quan Báo cáo
            </button>
            <button 
              onClick={() => setSubTab('mane')} 
              style={{ 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'mane' ? '#4472C4' : 'transparent',
                color: subTab === 'mane' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🔵 XLSC MANE ({data.reports.mane.detail_count})
            </button>
            <button 
              onClick={() => setSubTab('access')} 
              style={{ 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'access' ? '#ED7D31' : 'transparent',
                color: subTab === 'access' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🟠 XLSC ACCESS ({data.reports.access.detail_count})
            </button>
            <button 
              onClick={() => setSubTab('votuyen')} 
              style={{ 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'votuyen' ? '#70AD47' : 'transparent',
                color: subTab === 'votuyen' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🟢 XLSC VÔ TUYẾN ({data.reports.votuyen.detail_count})
            </button>
            <button 
              onClick={() => setSubTab('overdue')} 
              style={{ 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'overdue' ? '#C00000' : 'transparent',
                color: subTab === 'overdue' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🚨 PHIẾU QUÁ HẠN ({data.summary.overdue_count})
            </button>
            <button 
              onClick={() => setSubTab('email')} 
              style={{ 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'email' ? '#7030A0' : 'transparent',
                color: subTab === 'email' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              📧 THỐNG KÊ EMAIL NV ({data.summary.staff_count})
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="card-glass" style={{ padding: '28px 36px' }}>
            {subTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#1F3864', marginBottom: 20 }}>Bảng Tổng hợp Chỉ tiêu KPI theo Loại Mạng</h3>
                {renderStatTable(data.reports.mane.table, data.reports.mane.title, '#4472C4')}
                <div style={{ height: 32 }} />
                {renderStatTable(data.reports.access.table, data.reports.access.title, '#ED7D31')}
                <div style={{ height: 32 }} />
                {renderStatTable(data.reports.votuyen.table, data.reports.votuyen.title, '#70AD47')}
              </div>
            )}

            {subTab === 'mane' && renderStatTable(data.reports.mane.table, data.reports.mane.title, '#4472C4')}
            {subTab === 'access' && renderStatTable(data.reports.access.table, data.reports.access.title, '#ED7D31')}
            {subTab === 'votuyen' && renderStatTable(data.reports.votuyen.table, data.reports.votuyen.title, '#70AD47')}

            {subTab === 'overdue' && (
              <div>
                <h3 style={{ color: '#C00000', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={22} /> Danh sách Phiếu Quá Hạn Toàn Trình ({data.overdue.length} phiếu)
                </h3>
                {data.overdue.length === 0 ? (
                  <p style={{ color: '#16a34a', fontWeight: 600, padding: 20, background: '#f0fdf4', borderRadius: 8 }}>
                    ✅ Tuyệt vời! Không có phiếu nào bị quá hạn toàn trình.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: '#7B0000', color: '#fff', textAlign: 'left', fontSize: '0.9rem' }}>
                          <th style={{ padding: '12px 14px' }}>Loại Mạng</th>
                          <th style={{ padding: '12px 14px' }}>Mã Phiếu</th>
                          <th style={{ padding: '12px 14px' }}>Trạng Thái</th>
                          <th style={{ padding: '12px 14px' }}>Tổ Hạ Tầng</th>
                          <th style={{ padding: '12px 14px' }}>Đơn Vị Xử Lý</th>
                          <th style={{ padding: '12px 14px' }}>Đối Tượng / Node</th>
                          <th style={{ padding: '12px 14px' }}>Email Nhân Viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.overdue.map((row: any, idx: number) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#FFF5F5' : '#FFFFFF', borderBottom: '1px solid #fee2e2', fontSize: '0.92rem' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: row.type === 'MANE' ? '#4472C4' : (row.type === 'ACCESS' ? '#ED7D31' : '#70AD47') }}>{row.type}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#991b1b' }}>{row.ma_phieu}</td>
                            <td style={{ padding: '10px 14px' }}>{row.trang_thai}</td>
                            <td style={{ padding: '10px 14px', color: '#1F3864', fontWeight: 600 }}>{row.to_ht}</td>
                            <td style={{ padding: '10px 14px' }}>{row.don_vi}</td>
                            <td style={{ padding: '10px 14px' }}>{row.doi_tuong}</td>
                            <td style={{ padding: '10px 14px', color: '#4338ca' }}>{row.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {subTab === 'email' && (
              <div>
                <h3 style={{ color: '#7030A0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={22} /> Thống kê Thời gian Đóng phiếu Trung bình theo Email Nhân Viên (Từ chậm nhất &rarr; nhanh nhất)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#7030A0', color: '#fff', textAlign: 'left', fontSize: '0.9rem' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'center', width: 60 }}>STT</th>
                        <th style={{ padding: '12px 16px' }}>Email Nhân Viên</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Số Phiếu Xử Lý</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>TB Thời Gian Đóng Phiếu (giờ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.staff_emails.map((row: any, idx: number) => {
                        let badgeColor = '#16a34a'; // Nhanh (< 2h)
                        if (row.avg_hours >= 10) badgeColor = '#dc2626'; // Rất chậm (>= 10h)
                        else if (row.avg_hours >= 4) badgeColor = '#d97706'; // Trung bình chậm

                        return (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#F9F5FF' : '#FFFFFF', borderBottom: '1px solid #f3e8ff', fontSize: '0.95rem' }}>
                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#6b21a8' }}>{row.stt}</td>
                            <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1F3864' }}>{row.email}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{row.count}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                              <span style={{ 
                                background: badgeColor, color: '#fff', padding: '4px 12px', 
                                borderRadius: 20, fontWeight: 700, fontSize: '0.85rem' 
                              }}>
                                {row.avg_hours} giờ
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
