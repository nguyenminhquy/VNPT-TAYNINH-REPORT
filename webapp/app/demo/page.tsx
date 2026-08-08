'use client';
import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import PasteTable from '../../components/PasteTable';
import Link from 'next/link';

export default function DemoPage() {
  const [mbbData, setMbbData] = useState<string[][]>([]);
  const [fbbData, setFbbData] = useState<string[][]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/demo-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tables: {
            "B1_TAM": mbbData,
            "B2_TAM": fbbData
          }
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BAO_CAO_DEMO_${new Date().getTime()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất báo cáo!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500, marginBottom: 8, display: 'inline-block' }}>
            &larr; Quay lại trang chủ
          </Link>
          <h1 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>Demo Web Editor</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>Chức năng thử nghiệm: Paste số liệu trực tiếp lên web và xuất File Word.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 8, background: '#2563eb',
            color: '#fff', border: 'none', fontWeight: 600, fontSize: '1rem',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          {isExporting ? <Loader2 className="spin-anim" /> : <FileDown />}
          {isExporting ? 'Đang tạo Word...' : 'Xuất Báo Cáo'}
        </button>
      </div>

      <div style={{ background: '#f8fafc', padding: 40, borderRadius: 16, border: '1px solid #e2e8f0' }}>
        {/* Giả lập tài liệu Word */}
        <h2 style={{ textAlign: 'center', color: '#0f172a', marginBottom: 40 }}>BÁO CÁO THÁNG KỸ THUẬT</h2>
        
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ color: '#334155' }}>I. CHẤT LƯỢNG MẠNG DI ĐỘNG (MBB)</h3>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
            Trong tháng qua, chất lượng mạng lưới MBB đã được duy trì ổn định. Dưới đây là bảng tổng hợp số liệu chi tiết về lưu lượng và KPI của các trạm.
          </p>
          <PasteTable 
            title="1. Bảng số liệu MBB" 
            tag="(B1_TAM)" 
            onDataChange={setMbbData} 
          />
        </div>

        <div style={{ marginBottom: 40 }}>
          <h3 style={{ color: '#334155' }}>II. CHẤT LƯỢNG MẠNG BĂNG RỘNG CỐ ĐỊNH (FBB)</h3>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
            Công tác bảo trì mạng cáp quang FBB được thực hiện định kỳ. Số liệu xử lý suy hao và phát triển mới được thống kê như sau:
          </p>
          <PasteTable 
            title="2. Bảng số liệu FBB" 
            tag="(B2_TAM)" 
            onDataChange={setFbbData} 
          />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
