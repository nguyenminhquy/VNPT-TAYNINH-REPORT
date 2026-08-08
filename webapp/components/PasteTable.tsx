'use client';
import React, { useState, useRef } from 'react';
import { ClipboardPaste, Trash2 } from 'lucide-react';

interface PasteTableProps {
  title: string;
  tag: string;
  onDataChange: (data: string[][]) => void;
}

export default function PasteTable({ title, tag, onDataChange }: PasteTableProps) {
  const [data, setData] = useState<string[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    
    // Parse TSV (Tab Separated Values) typical of Excel
    const rows = text.split(/\r?\n/).map(row => row.split('\t'));
    const cleanRows = rows.filter(row => row.some(cell => cell.trim() !== ''));
    
    setData(cleanRows);
    onDataChange(cleanRows);
  };

  const clearData = () => {
    setData([]);
    onDataChange([]);
  };

  return (
    <div className="paste-table-container" style={{
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      background: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Thẻ nhúng: {tag}</p>
        </div>
        
        {data.length > 0 && (
          <button 
            onClick={clearData}
            style={{
              background: '#fee2e2', color: '#ef4444', border: 'none', 
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem'
            }}
          >
            <Trash2 size={14} /> Xóa dữ liệu
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div 
          ref={containerRef}
          tabIndex={0}
          onPaste={handlePaste}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 8,
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#f8fafc',
            outline: 'none'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
        >
          <ClipboardPaste size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
          <div style={{ color: '#475569', fontWeight: 500 }}>
            Click vào đây và ấn <kbd style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>Ctrl + V</kbd> để dán dữ liệu từ Excel
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <tbody>
              {data.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{
                      border: '1px solid #e2e8f0',
                      padding: '8px 12px',
                      whiteSpace: 'nowrap',
                      background: rIdx === 0 ? '#f8fafc' : '#fff',
                      fontWeight: rIdx === 0 ? 600 : 400
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
