"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Calendar, Save, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const AREAS = [
  { id: 'dan_nong', label: 'Dàn nóng' },
  { id: 'accu', label: 'Accu' },
  { id: 'phong_nguon', label: 'Phòng nguồn' },
  { id: 'phong_ewsd', label: 'Phòng EWSD' },
  { id: 'phong_truyen_dan', label: 'Phòng Truyền dẫn' },
  { id: 'phong_mane', label: 'Phòng MANE' },
  { id: 'phong_server_cntt', label: 'Phòng Server CNTT' },
  { id: 'phong_bsc_motorola', label: 'Phòng BSC Motorola (762-763)' },
  { id: 'phong_bsc_huawei', label: 'Phòng BSC Huawei (405)' }
];

export default function InspectionLog({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'history'>('new');
  
  // Custom user selection
  const [users, setUsers] = useState<any[]>([]);
  
  // Form State
  const [logId, setLogId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [selectedUserName, setSelectedUserName] = useState(user?.name || '');
  const [areasStatus, setAreasStatus] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchHistory();
    } else {
      // Auto update time when switching to "new" if no draft is loaded
      if (!logId) {
        setTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }));
      }
    }
  }, [activeSubTab]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (res.ok) {
        setUsers(json.users || []);
        if (!selectedUserName && user?.name) {
          setSelectedUserName(user.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (abnormalOnly) params.append('abnormalOnly', 'true');
      
      const res = await fetch('/api/inspection-logs?' + params.toString());
      if (!res.ok) throw new Error('Failed to fetch logs');
      const json = await res.json();
      setHistory(json.data || []);
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử kiểm tra');
    }
    setLoadingHistory(false);
  };

  const handleSave = async () => {
    if (!selectedUserName) {
      toast.error('Vui lòng chọn người kiểm tra');
      return;
    }
    
    // Check if any area is abnormal
    const isAbnormal = Object.values(areasStatus).some(val => val === 'Bất thường');
    if (isAbnormal && !notes.trim()) {
      toast.error('Vui lòng ghi chú chi tiết sự cố bất thường');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: logId,
        inspection_date: date,
        inspection_time: time,
        user_name: selectedUserName,
        areas_status: areasStatus,
        notes,
        is_abnormal: isAbnormal
      };

      const res = await fetch('/api/inspection-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save log');
      
      toast.success('Lưu nhật ký kiểm tra thành công!');
      
      // Reset form
      setLogId(undefined);
      setAreasStatus({});
      setNotes('');
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }));
      
    } catch (error) {
      toast.error('Lỗi khi lưu dữ liệu');
    }
    setIsSaving(false);
  };

  const loadRecord = (record: any) => {
    setLogId(record.id);
    setDate(record.inspection_date);
    setTime(record.inspection_time.slice(0, 5));
    setSelectedUserName(record.user_name || user?.name || '');
    setAreasStatus(record.areas_status || {});
    setNotes(record.notes || '');
    setActiveSubTab('new');
  };

  const exportExcel = () => {
    if (history.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const exportData = filteredHistory.map(row => {
      const data: Record<string, any> = {
        'Ngày': new Date(row.inspection_date).toLocaleDateString('vi-VN'),
        'Giờ': row.inspection_time.slice(0, 5),
        'Người kiểm tra': row.user_name,
      };

      AREAS.forEach(area => {
        data[area.label] = row.areas_status[area.id] || 'Bình thường';
      });

      data['Ghi chú'] = row.notes || '';
      return data;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NhatKyKiemTra');
    
    // Auto-size columns
    const maxWidths = exportData.reduce((acc: any, row: any) => {
      Object.keys(row).forEach(key => {
        const val = row[key] ? row[key].toString() : '';
        acc[key] = Math.max(acc[key] || key.length, val.length);
      });
      return acc;
    }, {});
    
    worksheet['!cols'] = Object.keys(exportData[0]).map(key => ({
      wch: Math.min(50, maxWidths[key] + 2)
    }));

    XLSX.writeFile(workbook, `NhatKyKiemTra_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredHistory = history.filter(record => {
    if (filterUser && !record.user_name?.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
        <button 
          onClick={() => setActiveSubTab('new')} 
          style={{ 
            background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
            color: activeSubTab === 'new' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Plus size={20} /> Nhập liệu
        </button>
        <button 
          onClick={() => setActiveSubTab('history')} 
          style={{ 
            background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
            color: activeSubTab === 'history' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Calendar size={20} /> Lịch sử kiểm tra
        </button>
      </div>

      {activeSubTab === 'new' && (
        <div className="card-glass" style={{ padding: '32px 40px' }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>
            {logId ? 'Chỉnh sửa Nhật ký' : 'Ghi chép Nhật ký kiểm tra mới'}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 24, marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Ngày kiểm tra</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Giờ kiểm tra</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Nhân viên kiểm tra</label>
              {users.length > 0 ? (
                <select
                  value={selectedUserName}
                  onChange={e => setSelectedUserName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}
                >
                  <option value="" disabled>-- Chọn nhân viên --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={selectedUserName} 
                  disabled 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#e2e8f0', color: '#64748b' }} 
                />
              )}
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', marginBottom: 16, color: 'var(--primary-color)' }}>Đánh giá trạng thái thiết bị / phòng máy</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
            {AREAS.map(area => {
              const status = areasStatus[area.id] || 'Bình thường';
              const isAbnormal = status === 'Bất thường';
              
              return (
                <div key={area.id} style={{ 
                  background: isAbnormal ? '#fee2e2' : '#f8fafc', 
                  border: isAbnormal ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  padding: 16, 
                  borderRadius: 12,
                  transition: 'all 0.2s ease'
                }}>
                  <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: isAbnormal ? '#991b1b' : 'var(--text-main)' }}>
                    {area.label}
                  </label>
                  <select 
                    value={status}
                    onChange={(e) => setAreasStatus(prev => ({ ...prev, [area.id]: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      border: isAbnormal ? '1px solid #f87171' : '1px solid #cbd5e1',
                      background: '#fff',
                      color: isAbnormal ? '#b91c1c' : 'inherit',
                      fontWeight: isAbnormal ? 600 : 400
                    }}
                  >
                    <option value="Bình thường">✅ Bình thường</option>
                    <option value="Bất thường">❌ Bất thường</option>
                  </select>
                </div>
              )
            })}
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Ghi chú chi tiết (bắt buộc nếu có bất thường)
            </label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Nhập chi tiết các sự cố, thiết bị hỏng hóc hoặc các vấn đề cần lưu ý..."
              style={{ width: '100%', padding: '14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 100 }} 
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="btn-export"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '1.05rem' }}
            >
              {isSaving ? <Loader2 size={20} className="spin-anim" /> : <Save size={20} />} Lưu nhật ký
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="card-glass" style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Lịch sử kiểm tra</h2>
            <button 
              onClick={exportExcel}
              className="btn-action btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
            >
              <Download size={18} /> Xuất Excel
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Từ ngày</label>
              <input 
                type="date" 
                value={filterStartDate} 
                onChange={e => setFilterStartDate(e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Đến ngày</label>
              <input 
                type="date" 
                value={filterEndDate} 
                onChange={e => setFilterEndDate(e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Nhân viên</label>
              <input 
                type="text" 
                placeholder="Tìm tên nhân viên..."
                value={filterUser} 
                onChange={e => setFilterUser(e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: '#b91c1c' }}>
                <input 
                  type="checkbox" 
                  checked={abnormalOnly}
                  onChange={e => setAbnormalOnly(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#dc2626' }}
                />
                Chỉ hiện Bất thường
              </label>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
             <button onClick={fetchHistory} className="btn-action" style={{ padding: '6px 16px', fontSize: '0.9rem' }}>
                Lọc dữ liệu
             </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin-anim" /></div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <table className="data-table" style={{ width: '100%', minWidth: 1200 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ minWidth: 100 }}>Ngày</th>
                    <th style={{ minWidth: 80 }}>Giờ</th>
                    <th style={{ minWidth: 150 }}>Người kiểm tra</th>
                    {AREAS.map(a => <th key={a.id} style={{ minWidth: 120 }}>{a.label}</th>)}
                    <th style={{ minWidth: 200 }}>Ghi chú</th>
                    <th style={{ minWidth: 100 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={AREAS.length + 5} style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                        Không có dữ liệu nhật ký kiểm tra.
                      </td>
                    </tr>
                  ) : filteredHistory.map(record => {
                    return (
                      <tr key={record.id} style={{ background: record.is_abnormal ? '#fef2f2' : 'inherit' }}>
                        <td>{new Date(record.inspection_date).toLocaleDateString('vi-VN')}</td>
                        <td>{record.inspection_time.slice(0, 5)}</td>
                        <td><strong>{record.user_name}</strong></td>
                        
                        {AREAS.map(area => {
                          const st = record.areas_status[area.id] || 'Bình thường';
                          return (
                            <td key={area.id}>
                              {st === 'Bất thường' ? (
                                <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <AlertTriangle size={14} /> Lỗi
                               </span>
                              ) : (
                                <span style={{ color: '#16a34a' }}>OK</span>
                              )}
                            </td>
                          );
                        })}
                        
                        <td>{record.notes}</td>
                        <td>
                          <button 
                            onClick={() => loadRecord(record)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
