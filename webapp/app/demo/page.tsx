'use client';
import React, { useState } from 'react';
import { Search, Bell, Download, Filter, Maximize2, ChevronDown } from 'lucide-react';
import SmartPasteTable from '../../components/SmartPasteTable';

export default function DemoDashboardPage() {
  const [activeSection, setActiveSection] = useState('olt');

  // Mock data for OLT
  const oltColumns = [
    { key: 'tht', label: 'Tổ Hạ Tầng', type: 'text' as const },
    { key: 'loai_tb', label: 'Loại TB', type: 'text' as const },
    { key: 't06', label: '06/2026', type: 'number' as const },
    { key: 't07', label: '07/2026', type: 'number' as const },
  ];
  
  const oltData = [
    { tht: 'Bến Lức', loai_tb: 'GPON', t06: 65, t07: 67 },
    { tht: 'Đức Hòa', loai_tb: 'GPON', t06: 51, t07: 49 },
    { tht: 'Gò Dầu', loai_tb: 'GPON', t06: 100, t07: 100 },
    { tht: 'Kiến Tường', loai_tb: 'GPON', t06: 12, t07: 15 },
  ];

  // Mock data for QoS
  const qosColumns = [
    { key: 'tht', label: 'Tổ Hạ Tầng', type: 'text' as const },
    { key: 't06', label: '06/2026', type: 'percentage' as const },
    { key: 't07', label: '07/2026', type: 'percentage' as const },
  ];

  const qosData = [
    { tht: 'Bến Lức', t06: 98.2, t07: 98.45 },
    { tht: 'Đức Hòa', t06: 98.1, t07: 98.21 },
    { tht: 'Gò Dầu', t06: 97.5, t07: 97.85 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar / Mục lục */}
      <div style={{ width: 280, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>BÁO CÁO THÁNG 8</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Trung Tâm Hạ Tầng VNPT</p>
        </div>
        
        <div style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 8 }}>I. Hiện trạng thiết bị</div>
            <button 
              onClick={() => setActiveSection('olt')}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: activeSection === 'olt' ? '#eff6ff' : 'transparent', color: activeSection === 'olt' ? '#2563eb' : '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: activeSection === 'olt' ? 600 : 500, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Thiết bị OLT
            </button>
            <button 
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
            >
              Thiết bị L2SW
            </button>
            <button 
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
            >
              Thiết bị Vô tuyến
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 8 }}>IV. Chất lượng mạng</div>
            <button 
              onClick={() => setActiveSection('qos')}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: activeSection === 'qos' ? '#eff6ff' : 'transparent', color: activeSection === 'qos' ? '#2563eb' : '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: activeSection === 'qos' ? 600 : 500 }}
            >
              Chất lượng FBB (QoS)
            </button>
            <button 
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
            >
              Sự cố Mất liên lạc (MLL)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ height: 70, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '8px 16px', borderRadius: 8, width: 300 }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Tìm kiếm trong báo cáo..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: 12, width: '100%', fontSize: '0.9rem', color: '#334155' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Bell size={20} /></button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
              <Download size={16} /> Xuất Báo Cáo
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            
            {/* KPI Cards (Giả lập) */}
            {activeSection === 'qos' && (
              <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                <div style={{ flex: 1, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>CLHTVT (QoS)</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#0f172a', fontWeight: 700 }}>98.78%</h3>
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, paddingBottom: 6 }}>Chưa đạt</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Mục tiêu: {'>'} 99%</p>
                </div>
              </div>
            )}

            {/* Content Sections */}
            {activeSection === 'olt' && (
              <div id="olt">
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 16px 0' }}>I. HIỆN TRẠNG THIẾT BỊ</h2>
                  <p style={{ color: '#475569', lineHeight: 1.6 }}>Số liệu thiết bị OLT trên toàn tỉnh cập nhật đến hết tháng 07/2026. Số liệu được tổng hợp tự động từ các Tổ Hạ tầng.</p>
                </div>
                
                <SmartPasteTable 
                  title="Bảng 2: Thiết bị OLT (B2_TAM)" 
                  initialColumns={oltColumns} 
                  initialData={oltData} 
                />
              </div>
            )}

            {activeSection === 'qos' && (
              <div id="qos">
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 16px 0' }}>IV. CHẤT LƯỢNG MẠNG</h2>
                  <p style={{ color: '#475569', lineHeight: 1.6 }}>Chất lượng hạ tầng VT-CNTT (QoS/QoE). Kết quả thực hiện đo lường mạng băng rộng cố định (FBB).</p>
                </div>
                
                <SmartPasteTable 
                  title="Bảng 18: Chỉ số QoS FBB (B18_BAO)" 
                  initialColumns={qosColumns} 
                  initialData={qosData} 
                />
                
                <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, marginTop: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>Nhận xét / Nguyên nhân</h4>
                    <button style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>Chỉnh sửa Text</button>
                  </div>
                  <p style={{ color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Trong tháng, chất lượng QoS của Bến Lức và Tân An có cải thiện nhẹ (+0.25%). Tuy nhiên, Gò Dầu vẫn chưa đạt mục tiêu đề ra (97.85% &lt; 99%) do ảnh hưởng của việc thi công cáp tại khu công nghiệp...
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
