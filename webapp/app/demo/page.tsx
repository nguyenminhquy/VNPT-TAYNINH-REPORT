'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Download, Filter, Maximize2, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';
import SmartPasteTable from '../../components/SmartPasteTable';
import { getTableDef } from '../../lib/demoTableDefs';
import reportDataRaw from '../../lib/reportData.json';

interface ReportBlock {
  type: string;
  text?: string;
  level?: number;
  tag?: string;
  original_text?: string;
}

const reportData: ReportBlock[] = reportDataRaw as any;

export default function DemoDashboardPage() {
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc ra các thẻ Heading để làm Sidebar
  const headings = reportData.filter(b => b.type === 'heading' && b.level && b.level <= 2);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el && contentRef.current) {
      contentRef.current.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      });
      setActiveHeadingId(id);
    }
  };

  const renderBlock = (block: ReportBlock, idx: number) => {
    if (searchTerm && block.text && !block.text.toLowerCase().includes(searchTerm.toLowerCase()) && block.type !== 'table_tag') {
      return null;
    }

    if (block.type === 'heading') {
      const id = `heading-${idx}`;
      const Tag = `h${block.level}` as any;
      const size = block.level === 1 ? '1.8rem' : block.level === 2 ? '1.4rem' : '1.1rem';
      const color = block.level === 1 ? '#0f172a' : '#1e293b';
      const margin = block.level === 1 ? '40px 0 20px' : '24px 0 12px';
      
      return (
        <Tag id={id} key={idx} style={{ fontSize: size, color, margin, fontWeight: 700 }}>
          {block.text}
        </Tag>
      );
    }
    
    if (block.type === 'paragraph') {
      return (
        <p key={idx} style={{ color: '#475569', lineHeight: 1.6, marginBottom: 12, textAlign: 'justify' }}>
          {block.text}
        </p>
      );
    }

    if (block.type === 'list_item') {
      return (
        <li key={idx} style={{ color: '#475569', lineHeight: 1.6, marginLeft: 20, marginBottom: 8 }}>
          {block.text}
        </li>
      );
    }

    if (block.type === 'table_tag') {
      const tag = block.tag || '';
      const { columns, data } = getTableDef(tag);
      return (
        <div key={idx} style={{ margin: '32px 0' }}>
          <SmartPasteTable 
            title={`Bảng dữ liệu: ${tag}`} 
            initialColumns={columns} 
            initialData={data} 
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar / Mục lục */}
      <div style={{ width: 300, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>BÁO CÁO THÁNG</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Trung Tâm Hạ Tầng VNPT</p>
        </div>
        
        <div style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
          {headings.map((h, i) => {
            const id = `heading-${reportData.indexOf(h)}`;
            const isLevel1 = h.level === 1;
            return (
              <button 
                key={i}
                onClick={() => scrollToSection(id)}
                style={{ 
                  width: '100%', textAlign: 'left', 
                  padding: isLevel1 ? '12px 12px' : '8px 12px 8px 24px', 
                  background: activeHeadingId === id ? '#eff6ff' : 'transparent', 
                  color: activeHeadingId === id ? '#2563eb' : (isLevel1 ? '#1e293b' : '#64748b'), 
                  border: 'none', borderRadius: 8, cursor: 'pointer', 
                  fontWeight: isLevel1 ? 700 : 500,
                  fontSize: isLevel1 ? '0.85rem' : '0.8rem',
                  textTransform: isLevel1 ? 'uppercase' : 'none',
                  display: 'block',
                  marginBottom: isLevel1 ? 4 : 2
                }}
              >
                {h.text}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ height: 70, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '8px 16px', borderRadius: 8, width: 400 }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Tìm kiếm trong báo cáo..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', padding: '60px 80px', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
            
            {/* KPI Cards Đầu Trang */}
            {!searchTerm && (
              <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Tỷ lệ Đạt KPI (Giả định)</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#0f172a', fontWeight: 800 }}>85%</h3>
                    <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={16} /> Khả quan</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Sự cố cần xử lý (Giả định)</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#0f172a', fontWeight: 800 }}>3</h3>
                    <span style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={16} /> Chú ý</span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Content Render Loop */}
            {reportData.map((block, idx) => renderBlock(block, idx))}

          </div>
        </div>
      </div>
    </div>
  );
}
