'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, Play, Download, CheckCircle, 
  AlertTriangle, Clock, Users, RefreshCw, FileText, 
  BarChart2, Layers, AlertCircle, Sparkles, Check, X,
  PieChart, TrendingUp, Award, Zap, Radio, Globe, Building2,
  Database, MapPin, ShieldAlert
} from 'lucide-react';

interface FileMapState {
  vt_tientrinh: File | null;
  access_tientrinh: File | null;
  mane_tientrinh: File | null;
  xlsc_cd5: File | null;
  votuyen_bc: File | null;
  export_map: File | null;
}

const FILE_CARDS_INFO = [
  {
    key: 'vt_tientrinh' as keyof FileMapState,
    title: '1. Tiến trình XLSC Vô Tuyến',
    desc: 'Nguồn OneBSS: File tiến trình xử lý sự cố mạng di động Vô tuyến.',
    icon: Radio,
    color: '#70AD47',
    bg: '#f0fdf4',
    border: '#bbf7d0'
  },
  {
    key: 'access_tientrinh' as keyof FileMapState,
    title: '2. Tiến trình XLSC ACCESS',
    desc: 'Nguồn OneBSS: File tiến trình xử lý sự cố mạng truy nhập ACCESS.',
    icon: Globe,
    color: '#ED7D31',
    bg: '#fff7ed',
    border: '#fed7aa'
  },
  {
    key: 'mane_tientrinh' as keyof FileMapState,
    title: '3. Tiến trình XLSC MANE',
    desc: 'Nguồn OneBSS: File tiến trình xử lý sự cố mạng lõi MANE.',
    icon: Building2,
    color: '#4472C4',
    bg: '#eff6ff',
    border: '#bfdbfe'
  },
  {
    key: 'xlsc_cd5' as keyof FileMapState,
    title: '4. XLSC Băng rộng Cố định CĐ5',
    desc: 'File chi tiết phiếu báo cáo xử lý sự cố Băng rộng cố định chuyên đề 5.',
    icon: Database,
    color: '#7030A0',
    bg: '#faf5ff',
    border: '#e9d5ff'
  },
  {
    key: 'votuyen_bc' as keyof FileMapState,
    title: '5. Báo cáo XLSC Trạm Vô Tuyến',
    desc: 'File báo cáo tổng hợp sự cố Trạm Vô Tuyến theo địa bàn tỉnh.',
    icon: BarChart2,
    color: '#1F3864',
    bg: '#f8fafc',
    border: '#cbd5e1'
  },
  {
    key: 'export_map' as keyof FileMapState,
    title: '6. Danh sách Mapping CSHT (export.xlsx)',
    desc: 'Bảng ánh xạ Mã Cơ sở hạ tầng (CSHT) sang Tổ Hạ tầng quản lý.',
    icon: MapPin,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
];

export default function Special5Report() {
  const [fileMap, setFileMap] = useState<FileMapState>({
    vt_tientrinh: null,
    access_tientrinh: null,
    mane_tientrinh: null,
    xlsc_cd5: null,
    votuyen_bc: null,
    export_map: null,
  });

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [subTab, setSubTab] = useState<'visualize' | 'overview' | 'mane' | 'access' | 'votuyen' | 'overdue' | 'email'>('visualize');
  const [useSample, setUseSample] = useState(false);
  const [activeChartNetwork, setActiveChartNetwork] = useState<'MANE' | 'ACCESS' | 'VOTUYEN'>('MANE');

  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      if (res.status === 413 || text.includes('Request Entity Too Large') || text.includes('too large') || text.includes('Request En')) {
        throw new Error('⚠️ Kích thước file vượt quá giới hạn của máy chủ Vercel (tối đa 4.5MB/request). Vui lòng chọn file nhỏ hơn hoặc dùng nút Dữ liệu Mẫu TTS!');
      }
      if (text.startsWith('<html') || text.startsWith('<!DOCTYPE')) {
        throw new Error(`⚠️ Lỗi máy chủ (${res.status}): Trang HTML bị trả về thay vì JSON. Vui lòng thử lại sau.`);
      }
      try {
        const errJson = JSON.parse(text);
        throw new Error(errJson.error || `Lỗi máy chủ (${res.status})`);
      } catch (e) {
        throw new Error(`⚠️ Lỗi (${res.status}): ${text.slice(0, 150)}`);
      }
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      if (text.includes('Request Entity Too Large') || text.includes('Request En')) {
        throw new Error('⚠️ Kích thước file vượt quá giới hạn của máy chủ Vercel (413 Payload Too Large).');
      }
      throw new Error(`⚠️ Dữ liệu trả về không phải JSON hợp lệ: ${text.slice(0, 100)}`);
    }
  };

  // Thử tải dữ liệu kết quả gần nhất nếu có
  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const json = await safeFetchJson('/api/cd5/result');
      if (json && json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      // bỏ qua nếu chưa có
    }
  };

  const handleSingleFileSelect = (key: keyof FileMapState, file: File | null) => {
    if (file && file.size > 4.5 * 1024 * 1024) {
      setError(`⚠️ CẢNH BÁO: File "${file.name}" có dung lượng ${(file.size / 1024 / 1024).toFixed(2)}MB. Vercel online có giới hạn tối đa 4.5MB/request nên file này có thể báo lỗi "Request Entity Too Large". Vui lòng chọn file nhỏ hơn hoặc kiểm thử offline!`);
    } else {
      setError(null);
    }
    setFileMap(prev => ({ ...prev, [key]: file }));
    setUseSample(false);
  };

  const selectedCount = Object.values(fileMap).filter(f => f !== null).length;

  const handleProcess = async (sample: boolean = false) => {
    setError(null);
    setProcessing(true);
    setUseSample(sample);

    try {
      // 1. Nếu không dùng mẫu thì upload từng file tuần tự (để tránh giới hạn 4.5MB của Vercel)
      if (!sample) {
        if (selectedCount === 0) {
          throw new Error('Vui lòng chọn file vào các thẻ tương ứng trước khi xử lý!');
        }
        setUploading(true);
        
        for (const [key, file] of Object.entries(fileMap)) {
          if (!file) continue;
          if (file.size > 4.5 * 1024 * 1024) {
            throw new Error(`⚠️ File "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)}MB) vượt quá giới hạn tải lên của Vercel online (tối đa 4.5MB/request). Vui lòng dùng nút "Dùng Dữ Liệu Mẫu TTS" để thử nghiệm ngay!`);
          }
          const formData = new FormData();
          formData.append(key, file);

          const upJson = await safeFetchJson('/api/cd5/upload', {
            method: 'POST',
            body: formData
          });

          if (!upJson || !upJson.success) {
            throw new Error(upJson?.error || `Lỗi tải lên file ${file.name}`);
          }
        }
        setUploading(false);
      }

      // 2. Gọi API xử lý dữ liệu và tạo báo cáo
      const procJson = await safeFetchJson('/api/cd5/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_sample: sample })
      });

      if (!procJson || !procJson.success) {
        throw new Error(procJson?.error || 'Lỗi trong quá trình tính toán và tạo báo cáo Excel.');
      }

      setData(procJson.data);
      setSubTab('visualize');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình thực hiện.');
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

  // Logic vẽ biểu đồ visualization
  const renderVisualAnalytics = () => {
    if (!data) return null;

    // 1. Dữ liệu mạng được chọn cho Bar chart Tổ Hạ tầng
    const activeTable = activeChartNetwork === 'MANE' 
      ? data.reports.mane.table 
      : (activeChartNetwork === 'ACCESS' ? data.reports.access.table : data.reports.votuyen.table);
    
    const activeColor = activeChartNetwork === 'MANE' 
      ? '#4472C4' 
      : (activeChartNetwork === 'ACCESS' ? '#ED7D31' : '#70AD47');

    const filteredRows = activeTable.filter((r: any) => r['Tổ Hạ tầng'] !== 'TỔNG');
    
    // 2. Phân bổ tổng giao theo 3 loại mạng
    const totalMane = data.reports.mane.table.find((r: any) => r['Tổ Hạ tầng'] === 'TỔNG')?.['Tổng giao'] || 0;
    const totalAccess = data.reports.access.table.find((r: any) => r['Tổ Hạ tầng'] === 'TỔNG')?.['Tổng giao'] || 0;
    const totalVotuyen = data.reports.votuyen.table.find((r: any) => r['Tổ Hạ tầng'] === 'TỔNG')?.['Tổng giao'] || 0;
    const grandTotal = totalMane + totalAccess + totalVotuyen || 1;
    
    const pctMane = Math.round((totalMane / grandTotal) * 100);
    const pctAccess = Math.round((totalAccess / grandTotal) * 100);
    const pctVotuyen = 100 - pctMane - pctAccess;

    // 3. Xếp hạng nhân viên nhanh / chậm
    const sortedStaff = [...(data.staff_emails || [])];
    const topFastest = sortedStaff.slice(0, 5);
    const topSlowest = sortedStaff.slice(-5).reverse();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* ROW 1: COMPARISON BAR CHART THEO TỔ HẠ TẦNG */}
        <div className="card-glass" style={{ padding: 28, background: '#ffffff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1F3864', display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={24} color={activeColor} /> Biểu đồ Tỉ lệ Hoàn thành Đúng hạn theo Tổ Hạ tầng (%)
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                So sánh chỉ tiêu hoàn thành đúng hạn giữa 7 Tổ Hạ tầng (Cột mốc tiêu chuẩn: &ge; 95%)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
              <button 
                onClick={() => setActiveChartNetwork('MANE')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  background: activeChartNetwork === 'MANE' ? '#4472C4' : 'transparent',
                  color: activeChartNetwork === 'MANE' ? '#fff' : '#64748b', transition: 'all 0.2s'
                }}
              >
                🔵 MANE
              </button>
              <button 
                onClick={() => setActiveChartNetwork('ACCESS')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  background: activeChartNetwork === 'ACCESS' ? '#ED7D31' : 'transparent',
                  color: activeChartNetwork === 'ACCESS' ? '#fff' : '#64748b', transition: 'all 0.2s'
                }}
              >
                🟠 ACCESS
              </button>
              <button 
                onClick={() => setActiveChartNetwork('VOTUYEN')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  background: activeChartNetwork === 'VOTUYEN' ? '#70AD47' : 'transparent',
                  color: activeChartNetwork === 'VOTUYEN' ? '#fff' : '#64748b', transition: 'all 0.2s'
                }}
              >
                🟢 VÔ TUYẾN
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredRows.map((row: any, idx: number) => {
              const rate = Number(row['Tỉ lệ HT đúng hạn']) || 0;
              let barColor = activeColor;
              let badgeText = 'ĐẠT';
              let badgeBg = '#dcfce7'; let badgeColor = '#166534';

              if (rate >= 95) {
                badgeText = '⭐ XUẤT SẮC';
                badgeBg = '#dcfce7'; badgeColor = '#15803d';
              } else if (rate >= 85) {
                badgeText = '🟢 TỐT';
                badgeBg = '#e0f2fe'; badgeColor = '#0369a1';
              } else {
                badgeText = '🔴 CẦN CẢI THIỆN';
                badgeBg = '#fee2e2'; badgeColor = '#b91c1c';
                barColor = '#ef4444';
              }

              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{row['Tổ Hạ tầng']}</div>
                  
                  <div style={{ background: '#f1f5f9', height: 24, borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(rate, 100)}%`, 
                        height: '100%', 
                        background: `linear-gradient(90deg, ${barColor}, ${barColor}ee)`,
                        borderRadius: 12,
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10
                      }}
                    >
                      {rate > 20 && (
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {rate}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    {rate <= 20 && <strong style={{ color: barColor, fontSize: '0.9rem' }}>{rate}%</strong>}
                    <span style={{ background: badgeBg, color: badgeColor, padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 2: PHÂN BỔ LOẠI MẠNG & CẢNH BÁO PHIẾU QUÁ HẠN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {/* DONUT PROPORTION */}
          <div className="card-glass" style={{ padding: 24, background: '#ffffff', borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', color: '#1F3864', display: 'flex', alignItems: 'center', gap: 10 }}>
              <PieChart size={22} color="#2E75B6" /> Phân Bổ Khối Lượng Phiếu Theo Mạng
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
              Tổng số phiếu sự cố được giao: <strong>{grandTotal} phiếu</strong>
            </p>

            {/* STACKED BAR */}
            <div style={{ display: 'flex', height: 36, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
              <div style={{ width: `${pctMane}%`, background: '#4472C4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }} title={`MANE: ${totalMane} phiếu`}>
                {pctMane > 10 ? `${pctMane}%` : ''}
              </div>
              <div style={{ width: `${pctAccess}%`, background: '#ED7D31', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }} title={`ACCESS: ${totalAccess} phiếu`}>
                {pctAccess > 10 ? `${pctAccess}%` : ''}
              </div>
              <div style={{ width: `${pctVotuyen}%`, background: '#70AD47', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }} title={`VÔ TUYẾN: ${totalVotuyen} phiếu`}>
                {pctVotuyen > 10 ? `${pctVotuyen}%` : ''}
              </div>
            </div>

            {/* LEGEND GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
              <div style={{ padding: 12, background: '#eff6ff', borderRadius: 10, borderBottom: '3px solid #4472C4' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>MANE</span>
                <strong style={{ fontSize: '1.3rem', color: '#1e3a8a' }}>{totalMane}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#60a5fa' }}>({pctMane}%)</span>
              </div>
              <div style={{ padding: 12, background: '#fff7ed', borderRadius: 10, borderBottom: '3px solid #ED7D31' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>ACCESS</span>
                <strong style={{ fontSize: '1.3rem', color: '#7c2d12' }}>{totalAccess}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#fb923c' }}>({pctAccess}%)</span>
              </div>
              <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 10, borderBottom: '3px solid #70AD47' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>VÔ TUYẾN</span>
                <strong style={{ fontSize: '1.3rem', color: '#14532d' }}>{totalVotuyen}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#4ade80' }}>({pctVotuyen}%)</span>
              </div>
            </div>
          </div>

          {/* OVERDUE ALERTS CARD */}
          <div className="card-glass" style={{ padding: 24, background: '#ffffff', borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', color: '#C00000', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={22} color="#C00000" /> Cảnh Báo Phiếu Quá Hạn Toàn Trình
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
              Tổng số phiếu tồn quá hạn cần xử lý gấp: <strong style={{ color: '#C00000' }}>{data.summary.overdue_count} phiếu</strong>
            </p>

            {data.overdue.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', background: '#f0fdf4', borderRadius: 12, color: '#16a34a' }}>
                <CheckCircle size={48} style={{ margin: '0 auto 12px' }} />
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>Tín Hiệu Rất Tốt!</strong>
                <span>Không có bất kỳ phiếu sự cố nào bị quá hạn toàn trình.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto' }}>
                {data.overdue.slice(0, 5).map((ov: any, idx: number) => (
                  <div key={idx} style={{ padding: '10px 14px', background: '#fff5f5', borderLeft: '4px solid #C00000', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ display: 'block', color: '#991b1b', fontSize: '0.9rem' }}>{ov.ma_phieu} ({ov.type})</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tổ: <strong>{ov.to_ht}</strong> - {ov.don_vi}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
                      Quá hạn
                    </span>
                  </div>
                ))}
                {data.overdue.length > 5 && (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', paddingTop: 8 }}>
                    &rarr; Xem toàn bộ {data.overdue.length} phiếu tại thẻ <strong>"🚨 PHIẾU QUÁ HẠN"</strong> bên trên.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: STAFF RESOLUTION SPEED LEADERBOARD */}
        <div className="card-glass" style={{ padding: 28, background: '#ffffff', borderRadius: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#7030A0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={24} color="#7030A0" /> Bảng Xếp Hạng Hiệu Suất &amp; Thời Gian Đóng Phiếu (Email Nhân viên)
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
            Thống kê thời gian xử lý sự cố trung bình (giờ) trên tổng số {data.summary.staff_count} nhân viên.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {/* TOP FASTEST */}
            <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 14, border: '1px solid #bbf7d0' }}>
              <h4 style={{ margin: '0 0 16px', color: '#166534', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <Zap size={20} color="#16a34a" /> Top 5 Nhân Viên Xử Lý Nhanh Nhất
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topFastest.map((st: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e293b' }}>{st.email}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đã xử lý: {st.count} phiếu</span>
                      </div>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontWeight: 800, fontSize: '0.85rem' }}>
                      {st.avg_hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP SLOWEST */}
            <div style={{ background: '#fff5f5', padding: 20, borderRadius: 14, border: '1px solid #fecaca' }}>
              <h4 style={{ margin: '0 0 16px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <Clock size={20} color="#dc2626" /> Top 5 Nhân Viên Có Thời Gian TB Đóng Phiếu Chậm Nhất
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topSlowest.map((st: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e293b' }}>{st.email}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đã xử lý: {st.count} phiếu</span>
                      </div>
                    </div>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: 20, fontWeight: 800, fontSize: '0.85rem' }}>
                      {st.avg_hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* HEADER BANNER */}
      <div className="card-glass" style={{ padding: '32px 40px', marginBottom: 28, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff', borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Sparkles className="animate-spin" size={28} style={{ color: '#ffd700' }} />
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>BÁO CÁO CHUYÊN ĐỀ 5 - TỰ ĐỘNG HÓA XLSC</h1>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1.05rem' }}>
              Hệ thống Web App thay thế tự động hóa quy trình xử lý sự cố, mapping Tổ Hạ tầng &amp; tính toán KPI Tây Ninh
            </p>
          </div>
          {data && (
            <button 
              onClick={handleDownload} 
              className="btn-action" 
              style={{ 
                background: '#22c55e', color: '#fff', padding: '14px 26px', fontSize: '1.05rem', 
                fontWeight: 700, borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Download size={22} /> TẢI XUỐNG EXCEL BÁO CÁO CĐ5 (5 SHEET)
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

      {/* 6 INDIVIDUAL FILE CARDS GRID SECTION */}
      <div className="card-glass" style={{ padding: '28px 36px', marginBottom: 32, background: '#ffffff', borderRadius: 20, boxShadow: '0 4px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#1F3864', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Upload size={24} color="#2E75B6" /> Khu Vực Nhập Liệu: Tải Lên 06 File Excel Đầu Vào
            </h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Vui lòng chọn hoặc kéo thả từng file theo đúng danh mục bên dưới để hệ thống ánh xạ dữ liệu chính xác nhất.
            </p>
          </div>

          <button 
            onClick={() => handleProcess(true)} 
            disabled={processing}
            style={{ 
              background: '#f8fafc', color: '#334155', padding: '10px 20px', fontWeight: 600, fontSize: '0.9rem',
              borderRadius: 12, border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: 8,
              cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}
          >
            {processing && useSample ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={18} color="#eab308" />}
            ⚡ Dùng Dữ Liệu Mẫu TTS Để Thử Nghiệm Ngay
          </button>
        </div>

        {/* 6 CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
          {FILE_CARDS_INFO.map(info => {
            const Icon = info.icon;
            const currentFile = fileMap[info.key];

            return (
              <div 
                key={info.key}
                style={{ 
                  padding: 20, 
                  borderRadius: 16, 
                  background: currentFile ? '#f0fdf4' : info.bg, 
                  border: `2px solid ${currentFile ? '#22c55e' : info.border}`,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: currentFile ? '#16a34a' : info.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </div>
                    <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{info.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', minHeight: 36 }}>
                    {info.desc}
                  </p>
                </div>

                {currentFile ? (
                  <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#15803d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentFile.name}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleSingleFileSelect(info.key, null)} 
                      title="Gỡ file này"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                    background: '#fff', padding: '10px', borderRadius: 10, border: '1px dashed #cbd5e1',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569',
                    transition: 'all 0.2s'
                  }}>
                    <Upload size={16} /> Chọn file .xlsx/.xls
                    <input 
                      type="file" 
                      accept=".xls,.xlsx" 
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0] || null;
                        handleSingleFileSelect(info.key, f);
                      }} 
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM ACTION BOX */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: '#f8fafc', padding: '16px 24px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', background: selectedCount === 6 ? '#22c55e' : '#3b82f6',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' 
            }}>
              {selectedCount}/6
            </div>
            <div>
              <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem' }}>
                {selectedCount === 6 ? '✨ Đã chọn đủ 06/06 file đầu vào!' : `Đã chọn ${selectedCount}/06 file Excel.`}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {selectedCount === 6 ? 'Bạn có thể bấm Xử lý ngay để hệ thống tổng hợp báo cáo.' : 'Vui lòng chọn thêm các file còn thiếu hoặc dùng dữ liệu mẫu.'}
              </span>
            </div>
          </div>

          <button 
            onClick={() => handleProcess(false)} 
            disabled={processing || (selectedCount === 0 && !data)}
            className="btn-action" 
            style={{ 
              background: selectedCount > 0 ? '#1F3864' : '#94a3b8', 
              color: '#fff', padding: '14px 32px', fontWeight: 700, fontSize: '1rem',
              borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 10,
              cursor: (processing || selectedCount === 0) ? 'not-allowed' : 'pointer',
              boxShadow: selectedCount > 0 ? '0 4px 15px rgba(31, 56, 100, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {processing && !useSample ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
            {processing && !useSample ? 'Đang Xử Lý & Tính Toán KPI...' : `⚡ Xử Lý File Upload (${selectedCount} File)`}
          </button>
        </div>

        {/* PROCESSING INDICATOR */}
        {processing && (
          <div style={{ marginTop: 20, padding: 18, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16 }}>
            <RefreshCw className="animate-spin" size={28} color="#2563eb" />
            <div>
              <strong style={{ color: '#1e40af', display: 'block', fontSize: '1.05rem' }}>Hệ thống đang thực hiện tự động hóa...</strong>
              <span style={{ fontSize: '0.9rem', color: '#3b82f6' }}>
                1️⃣ Chuẩn hóa 6 file Excel &rarr; 2️⃣ Mapping CSHT Tổ Hạ tầng &rarr; 3️⃣ Tính toán KPI MANE, ACCESS, VÔ TUYẾN &rarr; 4️⃣ Sinh báo cáo openpyxl 5 Sheet.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD KẾT QUẢ & TRỰC QUAN HÓA VISUALIZATION */}
      {data && (
        <div>
          {/* META INFO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#f8fafc', padding: '14px 24px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Thời gian báo cáo: </span>
              <strong style={{ color: '#0f172a', fontSize: '1.1rem', background: '#e2e8f0', padding: '4px 12px', borderRadius: 8, marginLeft: 6 }}>
                {data.meta.date_label}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Cập nhật lần cuối: </span>
              <strong style={{ color: '#0f172a' }}>{new Date(data.meta.generated_at).toLocaleTimeString('vi-VN')} {new Date(data.meta.generated_at).toLocaleDateString('vi-VN')}</strong>
            </div>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #2E75B6', background: '#fff', borderRadius: 16 }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>TỔNG GIAO</span>
              <strong style={{ fontSize: '1.9rem', color: '#1F3864' }}>{data.summary.total_giao}</strong>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #375623', background: '#fff', borderRadius: 16 }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>HOÀN THÀNH</span>
              <strong style={{ fontSize: '1.9rem', color: '#375623' }}>{data.summary.total_ht}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#16a34a', marginTop: 4, fontWeight: 600 }}>Đúng hạn: {data.summary.total_ht_dh}</span>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #2563eb', background: '#fff', borderRadius: 16 }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>TL HT ĐÚNG HẠN</span>
              <strong style={{ fontSize: '1.9rem', color: '#2563eb' }}>{data.summary.rate_ht_dh}%</strong>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #f59e0b', background: '#fff', borderRadius: 16 }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>TỔNG TỒN</span>
              <strong style={{ fontSize: '1.9rem', color: '#d97706' }}>{data.summary.total_ton}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Trong hạn: {data.summary.total_ton_th}</span>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #dc2626', background: '#fff', borderRadius: 16 }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>TỒN QUÁ HẠN</span>
              <strong style={{ fontSize: '1.9rem', color: '#dc2626' }}>{data.summary.total_ton_qh}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#dc2626', marginTop: 4, fontWeight: 600 }}>TL: {data.summary.rate_ton_qh}%</span>
            </div>
            <div className="card-glass" style={{ padding: 20, textAlign: 'center', borderTop: '4px solid #7b0000', background: '#fff5f5', borderRadius: 16 }}>
              <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>PHIẾU QUÁ HẠN TT</span>
              <strong style={{ fontSize: '1.9rem', color: '#7b0000' }}>{data.summary.overdue_count}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#991b1b', marginTop: 4, fontWeight: 600 }}>Cần xử lý gấp</span>
            </div>
          </div>

          {/* SUB NAVIGATION TABS */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 24, overflowX: 'auto' }}>
            <button 
              onClick={() => setSubTab('visualize')} 
              style={{ 
                padding: '12px 22px', borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: subTab === 'visualize' ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : '#f1f5f9',
                color: subTab === 'visualize' ? '#fff' : '#475569', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: subTab === 'visualize' ? '0 4px 12px rgba(30, 60, 114, 0.25)' : 'none'
              }}
            >
              📈 Biểu đồ Trực quan hóa (Visual Analytics)
            </button>
            <button 
              onClick={() => setSubTab('overview')} 
              style={{ 
                padding: '12px 20px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'overview' ? '#1F3864' : 'transparent',
                color: subTab === 'overview' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              📊 Bảng Số liệu KPI
            </button>
            <button 
              onClick={() => setSubTab('mane')} 
              style={{ 
                padding: '12px 20px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'mane' ? '#4472C4' : 'transparent',
                color: subTab === 'mane' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🔵 MANE ({data.reports.mane.detail_count})
            </button>
            <button 
              onClick={() => setSubTab('access')} 
              style={{ 
                padding: '12px 20px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'access' ? '#ED7D31' : 'transparent',
                color: subTab === 'access' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🟠 ACCESS ({data.reports.access.detail_count})
            </button>
            <button 
              onClick={() => setSubTab('votuyen')} 
              style={{ 
                padding: '12px 20px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'votuyen' ? '#70AD47' : 'transparent',
                color: subTab === 'votuyen' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🟢 VÔ TUYẾN ({data.reports.votuyen.detail_count})
            </button>
            <button 
              onClick={() => setSubTab('overdue')} 
              style={{ 
                padding: '12px 20px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'overdue' ? '#C00000' : 'transparent',
                color: subTab === 'overdue' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              🚨 PHIẾU QUÁ HẠN ({data.summary.overdue_count})
            </button>
            <button 
              onClick={() => setSubTab('email')} 
              style={{ 
                padding: '12px 20px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: subTab === 'email' ? '#7030A0' : 'transparent',
                color: subTab === 'email' ? '#fff' : '#64748b', transition: 'all 0.2s'
              }}
            >
              📧 THỐNG KÊ EMAIL ({data.summary.staff_count})
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="card-glass" style={{ padding: '32px 36px', background: '#ffffff', borderRadius: 20 }}>
            {subTab === 'visualize' && renderVisualAnalytics()}

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
