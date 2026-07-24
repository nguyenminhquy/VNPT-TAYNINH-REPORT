"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Calendar, Save, Download, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PARAMS = [
  { id: 'muc_dau', label: 'Mức dầu (%)', type: 'number', placeholder: 'VD: 80' },
  { id: 'dien_ap_accu_truoc', label: 'Điện áp bình ACCU (V)', type: 'number', tooltip: 'Điện áp đo tổng 2 bình accu khi không chạy MPD', placeholder: 'VD: 24' },
  { id: 'dien_ap_accu_sau', label: 'Điện áp ACCU khi chạy (V)', type: 'number', tooltip: 'Điện áp đo tổng 2 bình accu khi MPD đang chạy', placeholder: 'VD: 26.5' },
  { id: 'ap_luc_nhot', label: 'Áp lực nhớt mức thấp (bar)', type: 'number', tooltip: "Sau khi chạy không tải 15'", placeholder: 'VD: 4.5' },
  { id: 'nhiet_do', label: 'Nhiệt độ (°C)', type: 'number', tooltip: "Sau khi chạy không tải 15'", placeholder: 'VD: 75' },
  { id: 'canh_bao', label: 'Cảnh báo', type: 'select', tooltip: 'Tên cảnh báo khi MPD hoạt động' },
  { id: 'bat_thuong', label: 'Bất thường khác', type: 'select', tooltip: "Trong quá trình chạy không tải 15'" }
];

const DEFAULT_DATA = {
  muc_dau: '',
  dien_ap_accu_truoc: '',
  dien_ap_accu_sau: '',
  ap_luc_nhot: '',
  nhiet_do: '',
  canh_bao: 'Không',
  canh_bao_detail: '',
  bat_thuong: 'Không',
  bat_thuong_detail: ''
};

export default function GeneratorLog({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'history'>('new');
  
  // Custom user selection
  const [users, setUsers] = useState<any[]>([]);
  
  // Form State
  const [logId, setLogId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [selectedUserName, setSelectedUserName] = useState(user?.name || '');
  
  const [mpd200, setMpd200] = useState<Record<string, string>>({ ...DEFAULT_DATA });
  const [mpd350, setMpd350] = useState<Record<string, string>>({ ...DEFAULT_DATA });
  
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
      
      const res = await fetch('/api/generator-logs?' + params.toString());
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
    
    // Check if any required fields missing (optional based on business logic, here we just allow empty for flexibility, or maybe require them)
    // We will check for abnormal status
    const isMpd200Abnormal = mpd200.canh_bao === 'Có sự cố' || mpd200.bat_thuong === 'Có sự cố';
    const isMpd350Abnormal = mpd350.canh_bao === 'Có sự cố' || mpd350.bat_thuong === 'Có sự cố';
    
    if (isMpd200Abnormal && (!mpd200.canh_bao_detail?.trim() && !mpd200.bat_thuong_detail?.trim())) {
       toast.error('Vui lòng ghi chú chi tiết sự cố MPD 200 KVA');
       return;
    }
    if (isMpd350Abnormal && (!mpd350.canh_bao_detail?.trim() && !mpd350.bat_thuong_detail?.trim())) {
       toast.error('Vui lòng ghi chú chi tiết sự cố MPD 350 KVA');
       return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: logId,
        inspection_date: date,
        inspection_time: time,
        user_name: selectedUserName,
        mpd_200_data: mpd200,
        mpd_350_data: mpd350,
        is_abnormal: isMpd200Abnormal || isMpd350Abnormal
      };

      const res = await fetch('/api/generator-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save log');
      
      toast.success('Lưu nhật ký kiểm tra máy phát điện thành công!');
      
      // Reset form
      setLogId(undefined);
      setMpd200({ ...DEFAULT_DATA });
      setMpd350({ ...DEFAULT_DATA });
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
    setMpd200(record.mpd_200_data || { ...DEFAULT_DATA });
    setMpd350(record.mpd_350_data || { ...DEFAULT_DATA });
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

      // 200 KVA
      data['200_Mức dầu (%)'] = row.mpd_200_data.muc_dau;
      data['200_Áp bình ACCU (V) tĩnh'] = row.mpd_200_data.dien_ap_accu_truoc;
      data['200_Áp bình ACCU (V) động'] = row.mpd_200_data.dien_ap_accu_sau;
      data['200_Áp lực nhớt (bar)'] = row.mpd_200_data.ap_luc_nhot;
      data['200_Nhiệt độ (°C)'] = row.mpd_200_data.nhiet_do;
      data['200_Cảnh báo'] = row.mpd_200_data.canh_bao === 'Có sự cố' ? row.mpd_200_data.canh_bao_detail : 'Không';
      data['200_Bất thường'] = row.mpd_200_data.bat_thuong === 'Có sự cố' ? row.mpd_200_data.bat_thuong_detail : 'Không';

      // 350 KVA
      data['350_Mức dầu (%)'] = row.mpd_350_data.muc_dau;
      data['350_Áp bình ACCU (V) tĩnh'] = row.mpd_350_data.dien_ap_accu_truoc;
      data['350_Áp bình ACCU (V) động'] = row.mpd_350_data.dien_ap_accu_sau;
      data['350_Áp lực nhớt (bar)'] = row.mpd_350_data.ap_luc_nhot;
      data['350_Nhiệt độ (°C)'] = row.mpd_350_data.nhiet_do;
      data['350_Cảnh báo'] = row.mpd_350_data.canh_bao === 'Có sự cố' ? row.mpd_350_data.canh_bao_detail : 'Không';
      data['350_Bất thường'] = row.mpd_350_data.bat_thuong === 'Có sự cố' ? row.mpd_350_data.bat_thuong_detail : 'Không';

      return data;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NhatKyMayPhatDien');
    XLSX.writeFile(workbook, `NhatKyMayPhatDien_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredHistory = history.filter(record => {
    if (filterUser && !record.user_name?.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  const renderMachineForm = (title: string, data: Record<string, string>, setter: React.Dispatch<React.SetStateAction<Record<string, string>>>) => (
    <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--primary-color)', textAlign: 'center' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PARAMS.map(param => (
          <div key={param.id}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>
              {param.label}
              {param.tooltip && (
                <div title={param.tooltip} style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                  <Info size={14} />
                </div>
              )}
            </label>
            {param.type === 'number' ? (
              <input 
                type="number" 
                placeholder={param.placeholder}
                value={data[param.id] || ''}
                onChange={e => setter(prev => ({ ...prev, [param.id]: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select 
                  value={data[param.id] || 'Không'}
                  onChange={e => {
                    setter(prev => {
                      const newData = { ...prev, [param.id]: e.target.value };
                      if (e.target.value === 'Không') {
                        newData[`${param.id}_detail`] = '';
                      }
                      return newData;
                    });
                  }}
                  style={{ 
                    width: '100%', padding: '10px 14px', borderRadius: 8, 
                    border: data[param.id] === 'Có sự cố' ? '1px solid #f87171' : '1px solid #cbd5e1',
                    background: data[param.id] === 'Có sự cố' ? '#fef2f2' : '#fff',
                    color: data[param.id] === 'Có sự cố' ? '#b91c1c' : 'inherit',
                    fontWeight: data[param.id] === 'Có sự cố' ? 600 : 400
                  }}
                >
                  <option value="Không">✅ Không</option>
                  <option value="Có sự cố">❌ Có sự cố</option>
                </select>
                {data[param.id] === 'Có sự cố' && (
                  <input 
                    type="text" 
                    placeholder="Nhập mô tả sự cố..."
                    value={data[`${param.id}_detail`] || ''}
                    onChange={e => setter(prev => ({ ...prev, [`${param.id}_detail`]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff' }}
                    autoFocus
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

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
            {logId ? 'Chỉnh sửa Nhật ký' : 'Ghi chép Nhật ký Máy Phát Điện'}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
            {renderMachineForm('Thông số MPD 200 KVA', mpd200, setMpd200)}
            {renderMachineForm('Thông số MPD 350 KVA', mpd350, setMpd350)}
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="btn-export"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 40px', fontSize: '1.1rem' }}
            >
              {isSaving ? <Loader2 size={20} className="spin-anim" /> : <Save size={20} />} LƯU THÔNG SỐ
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="card-glass" style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Lịch sử kiểm tra MPD</h2>
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
              <table className="data-table" style={{ width: '100%', minWidth: 1600 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th rowSpan={2} style={{ minWidth: 100, borderBottom: '2px solid #cbd5e1' }}>Ngày</th>
                    <th rowSpan={2} style={{ minWidth: 80, borderBottom: '2px solid #cbd5e1' }}>Giờ</th>
                    <th rowSpan={2} style={{ minWidth: 150, borderBottom: '2px solid #cbd5e1' }}>Người kiểm tra</th>
                    <th colSpan={7} style={{ textAlign: 'center', background: '#e0f2fe', borderBottom: '1px solid #cbd5e1', color: '#0369a1' }}>MPD 200 KVA</th>
                    <th colSpan={7} style={{ textAlign: 'center', background: '#fef3c7', borderBottom: '1px solid #cbd5e1', color: '#b45309' }}>MPD 350 KVA</th>
                    <th rowSpan={2} style={{ minWidth: 80, borderBottom: '2px solid #cbd5e1' }}>Sửa</th>
                  </tr>
                  <tr>
                    <th style={{ background: '#f0f9ff' }}>Dầu(%)</th>
                    <th style={{ background: '#f0f9ff' }}>Áp Tĩnh(V)</th>
                    <th style={{ background: '#f0f9ff' }}>Áp Động(V)</th>
                    <th style={{ background: '#f0f9ff' }}>Nhớt(bar)</th>
                    <th style={{ background: '#f0f9ff' }}>Nhiệt(°C)</th>
                    <th style={{ background: '#f0f9ff', color: '#b91c1c' }}>Cảnh báo</th>
                    <th style={{ background: '#f0f9ff', color: '#b91c1c' }}>Bất thường</th>
                    <th style={{ background: '#fffbeb' }}>Dầu(%)</th>
                    <th style={{ background: '#fffbeb' }}>Áp Tĩnh(V)</th>
                    <th style={{ background: '#fffbeb' }}>Áp Động(V)</th>
                    <th style={{ background: '#fffbeb' }}>Nhớt(bar)</th>
                    <th style={{ background: '#fffbeb' }}>Nhiệt(°C)</th>
                    <th style={{ background: '#fffbeb', color: '#b91c1c' }}>Cảnh báo</th>
                    <th style={{ background: '#fffbeb', color: '#b91c1c' }}>Bất thường</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={18} style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                        Không có dữ liệu nhật ký máy phát điện.
                      </td>
                    </tr>
                  ) : filteredHistory.map(record => {
                    const m2 = record.mpd_200_data || {};
                    const m3 = record.mpd_350_data || {};
                    
                    return (
                      <tr key={record.id} style={{ background: record.is_abnormal ? '#fef2f2' : 'inherit' }}>
                        <td>{new Date(record.inspection_date).toLocaleDateString('vi-VN')}</td>
                        <td>{record.inspection_time.slice(0, 5)}</td>
                        <td><strong>{record.user_name}</strong></td>
                        
                        {/* 200 KVA */}
                        <td>{m2.muc_dau}</td>
                        <td>{m2.dien_ap_accu_truoc}</td>
                        <td>{m2.dien_ap_accu_sau}</td>
                        <td>{m2.ap_luc_nhot}</td>
                        <td>{m2.nhiet_do}</td>
                        <td style={{ color: m2.canh_bao === 'Có sự cố' ? '#dc2626' : 'inherit', fontWeight: m2.canh_bao === 'Có sự cố' ? 600 : 400 }}>
                          {m2.canh_bao === 'Có sự cố' ? (m2.canh_bao_detail || 'Có') : ''}
                        </td>
                        <td style={{ color: m2.bat_thuong === 'Có sự cố' ? '#dc2626' : 'inherit', fontWeight: m2.bat_thuong === 'Có sự cố' ? 600 : 400 }}>
                          {m2.bat_thuong === 'Có sự cố' ? (m2.bat_thuong_detail || 'Có') : ''}
                        </td>

                        {/* 350 KVA */}
                        <td>{m3.muc_dau}</td>
                        <td>{m3.dien_ap_accu_truoc}</td>
                        <td>{m3.dien_ap_accu_sau}</td>
                        <td>{m3.ap_luc_nhot}</td>
                        <td>{m3.nhiet_do}</td>
                        <td style={{ color: m3.canh_bao === 'Có sự cố' ? '#dc2626' : 'inherit', fontWeight: m3.canh_bao === 'Có sự cố' ? 600 : 400 }}>
                          {m3.canh_bao === 'Có sự cố' ? (m3.canh_bao_detail || 'Có') : ''}
                        </td>
                        <td style={{ color: m3.bat_thuong === 'Có sự cố' ? '#dc2626' : 'inherit', fontWeight: m3.bat_thuong === 'Có sự cố' ? 600 : 400 }}>
                          {m3.bat_thuong === 'Có sự cố' ? (m3.bat_thuong_detail || 'Có') : ''}
                        </td>

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
