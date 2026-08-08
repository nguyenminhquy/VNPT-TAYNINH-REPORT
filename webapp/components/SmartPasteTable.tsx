'use client';
import React, { useState } from 'react';
import { Edit3, Check, X, ArrowUp, ArrowDown, Minus, Play } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'percentage';
}

interface SmartPasteTableProps {
  title: string;
  initialColumns: Column[];
  initialData: any[];
}

export default function SmartPasteTable({ title, initialColumns, initialData }: SmartPasteTableProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [data, setData] = useState<any[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  
  // Preview state
  const [previewChanges, setPreviewChanges] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    setPasteText('');
    setPreviewChanges([]);
    setIsAnalyzing(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const parseNumber = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const strVal = val.toString().trim();
    let cleaned = strVal.replace(/%/g, '').trim();
    
    // Handle Vietnamese number formats
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(/,/g, '.');
    } else if (cleaned.includes('.') && cleaned.includes(',')) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        // VN format: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // US format: 1,234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const normalizeStr = (s: string) => {
    return s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, "");      // remove spaces and special chars
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    const rows = pasteText.split(/\r?\n/).filter(r => r.trim());
    if (rows.length === 0) {
      alert("Không có dữ liệu hợp lệ!");
      setIsAnalyzing(false);
      return;
    }

    const newChanges: any[] = [];
    const idKey = columns[0]?.key;
    if (!idKey) {
      setIsAnalyzing(false);
      return;
    }

    const firstRowCells = rows[0].split('\t').map(c => c.trim());
    const isFirstRowData = data.some(d => 
      d[idKey] && normalizeStr(d[idKey].toString()) === normalizeStr(firstRowCells[0])
    );
    
    let colMap: Record<number, string> = {};
    let startIndex = 0;

    if (isFirstRowData) {
      // Paste content doesn't have headers
      columns.forEach((c, idx) => {
        colMap[idx] = c.key;
      });
      startIndex = 0;
    } else {
      // Paste content has headers
      startIndex = 1;
      firstRowCells.forEach((h, idx) => {
        const normH = normalizeStr(h);
        const match = columns.find(c => normalizeStr(c.label) === normH || normalizeStr(c.key) === normH);
        if (match) {
          colMap[idx] = match.key;
        }
      });
      
      // Fallback: map by position if fuzzy match failed but length is same
      if (Object.keys(colMap).length <= 1 && firstRowCells.length === columns.length) {
        columns.forEach((c, idx) => {
          colMap[idx] = c.key;
        });
      }
    }

    for (let i = startIndex; i < rows.length; i++) {
      const cells = rows[i].split('\t').map(c => c.trim());
      if (cells.length === 0) continue;
      
      const idVal = cells[0];
      const normIdVal = normalizeStr(idVal);
      const existingRow = data.find(d => d[idKey] && normalizeStr(d[idKey].toString()) === normIdVal);
      
      if (existingRow) {
        const changes: Record<string, { old: any, new: any }> = {};
        let hasChanges = false;
        
        cells.forEach((cellVal, idx) => {
          if (idx === 0) return; // skip ID
          const cKey = colMap[idx];
          if (cKey) {
            const oldVal = existingRow[cKey];
            const newVal = parseNumber(cellVal);
            const oldNum = parseNumber(oldVal);
            
            if (newVal !== oldNum) {
              changes[cKey] = { old: oldNum, new: newVal };
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          newChanges.push({
            id: existingRow[idKey],
            changes
          });
        }
      }
    }

    if (newChanges.length === 0) {
      alert("Không tìm thấy thay đổi nào hoặc ID không khớp!");
    }

    setPreviewChanges(newChanges);
    setIsAnalyzing(false);
  };

  const applyChanges = () => {
    const newData = [...data];
    const idKey = columns[0].key;
    
    previewChanges.forEach(pc => {
      const rowIndex = newData.findIndex(d => d[idKey] === pc.id);
      if (rowIndex !== -1) {
        const updatedRow = { ...newData[rowIndex] };
        Object.keys(pc.changes).forEach(k => {
          updatedRow[k] = pc.changes[k].new;
        });
        newData[rowIndex] = updatedRow;
      }
    });
    
    setData(newData);
    closeModal();
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 32, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>{title}</h3>
        <button onClick={openModal} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 500 }}>
          <Edit3 size={16} /> Cập nhật dữ liệu
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', background: '#f1f5f9', color: '#475569', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                {columns.map((col, cIdx) => (
                  <td key={col.key} style={{ padding: '12px 16px', color: '#334155' }}>
                    {col.type === 'percentage' && row[col.key] !== undefined ? `${row[col.key]}%` : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '800px', maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>CẬP NHẬT DỮ LIỆU – {title.toUpperCase()}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {!isAnalyzing ? (
                <>
                  <p style={{ color: '#475569', marginBottom: 12 }}>Dán dữ liệu từ Excel, Word hoặc văn bản vào đây. Hệ thống sẽ tự động nhận dạng dữ liệu.</p>
                  <textarea 
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="VD:&#10;THT&#9;06/2026&#9;07/2026&#10;Bến Lức&#9;65&#9;67"
                    style={{ width: '100%', height: 200, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'monospace', resize: 'vertical' }}
                  />
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={closeModal} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Hủy</button>
                    <button onClick={handleAnalyze} disabled={!pasteText.trim()} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: pasteText.trim() ? 'pointer' : 'not-allowed', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Play size={16} /> Phân tích dữ liệu
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ marginTop: 0, color: '#0f172a' }}>Preview Thay Đổi</h3>
                  {previewChanges.length === 0 ? (
                    <div style={{ padding: 20, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
                      Không phát hiện thay đổi nào hợp lệ. Vui lòng kiểm tra lại cấu trúc copy.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '12px 16px', borderRadius: 8, fontWeight: 500 }}>
                        Phát hiện {previewChanges.length} dòng có thay đổi.
                      </div>
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Đơn vị</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Trường</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Cũ</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Mới</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Thay đổi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewChanges.map((pc, idx) => (
                            Object.keys(pc.changes).map((field, fIdx) => {
                              const chg = pc.changes[field];
                              const diff = chg.new - chg.old;
                              const diffStr = diff > 0 ? `+${diff}` : diff.toString();
                              return (
                                <tr key={`${idx}-${fIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: 12, fontWeight: 500 }}>{pc.id}</td>
                                  <td style={{ padding: 12 }}>{columns.find(c => c.key === field)?.label || field}</td>
                                  <td style={{ padding: 12, color: '#64748b' }}>{chg.old}</td>
                                  <td style={{ padding: 12, color: '#0f172a', fontWeight: 600 }}>{chg.new}</td>
                                  <td style={{ padding: 12 }}>
                                    <span style={{ 
                                      display: 'inline-flex', alignItems: 'center', gap: 4, 
                                      color: diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b',
                                      background: diff > 0 ? '#dcfce7' : diff < 0 ? '#fee2e2' : '#f1f5f9',
                                      padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600
                                    }}>
                                      {diff > 0 ? <ArrowUp size={12} /> : diff < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                                      {diffStr}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={() => setIsAnalyzing(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Quay lại</button>
                    {previewChanges.length > 0 && (
                      <button onClick={applyChanges} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check size={16} /> Xác nhận cập nhật
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
