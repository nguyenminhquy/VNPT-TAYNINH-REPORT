"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, Send, CheckSquare, History, Settings } from "lucide-react";
import toast from "react-hot-toast";

type ShiftType = 1 | 2 | 3;

interface ChecklistItem {
  id: string;
  content: string;
  shift_type: number;
  is_active: boolean;
  display_order: number;
}

interface HandoverDraft {
  id?: string;
  shift_type: ShiftType;
  handover_date: string;
  notes: string;
  items: Record<string, boolean>; // id -> checked state
  status: 'draft' | 'completed';
}

export default function ShiftHandover({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'history' | 'admin'>('new');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Handover state
  const [currentShift, setCurrentShift] = useState<ShiftType>(1);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'new') {
      fetchChecklist(currentShift);
    } else if (activeSubTab === 'history') {
      fetchHistory();
    } else if (activeSubTab === 'admin') {
      fetchChecklist(); // fetch all
    }
  }, [activeSubTab, currentShift]);

  const fetchChecklist = async (shift?: ShiftType) => {
    setLoadingItems(true);
    try {
      const url = shift ? `/api/shift-checklist?shift_type=${shift}` : `/api/shift-checklist`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setChecklistItems(json.items || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi tải danh sách công việc');
    }
    setLoadingItems(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/shift-handover`);
      const json = await res.json();
      if (res.ok) {
        setHistory(json.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi tải lịch sử');
    }
    setLoadingHistory(false);
  };

  const handleToggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCheckAll = () => {
    const allChecked = checklistItems.every(item => checkedItems[item.id]);
    const newState = { ...checkedItems };
    checklistItems.forEach(item => {
      newState[item.id] = !allChecked;
    });
    setCheckedItems(newState);
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    if (status === 'completed' && !window.confirm('Bạn có chắc chắn muốn CHỐT ca? Sau khi chốt sẽ không thể sửa đổi.')) {
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(status === 'completed' ? 'Đang chốt ca...' : 'Đang lưu nháp...');
    
    try {
      const payload = {
        id: draftId,
        shift_type: currentShift,
        handover_date: handoverDate,
        notes,
        items: checkedItems,
        status
      };

      const res = await fetch('/api/shift-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(status === 'completed' ? 'Chốt ca thành công!' : 'Lưu nháp thành công!', { id: toastId });
        if (json.data?.id) {
          setDraftId(json.data.id);
        }
        if (status === 'completed') {
          // Reset form after complete
          setNotes('');
          setCheckedItems({});
          setDraftId(undefined);
          setActiveSubTab('history');
        }
      } else {
        toast.error(`Lỗi: ${json.error}`, { id: toastId });
      }
    } catch (e) {
      toast.error('Lỗi mạng', { id: toastId });
    }
    setIsSaving(false);
  };

  const loadDraft = (record: any) => {
    setCurrentShift(record.shift_type);
    setHandoverDate(record.handover_date);
    setNotes(record.notes || '');
    setCheckedItems(record.items || {});
    setDraftId(record.id);
    setActiveSubTab('new');
  };

  // Admin section state
  const [adminItemContent, setAdminItemContent] = useState('');
  const [adminShiftType, setAdminShiftType] = useState<number>(0);

  const handleAddChecklistItem = async () => {
    if (!adminItemContent.trim()) return;
    const toastId = toast.loading('Đang thêm...');
    try {
      const res = await fetch('/api/shift-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          item: {
            content: adminItemContent,
            shift_type: adminShiftType,
            display_order: checklistItems.length + 1
          }
        })
      });
      if (res.ok) {
        toast.success('Thêm thành công', { id: toastId });
        setAdminItemContent('');
        fetchChecklist();
      } else {
        toast.error('Lỗi thêm', { id: toastId });
      }
    } catch (e) {
      toast.error('Lỗi mạng', { id: toastId });
    }
  };

  const handleDeleteChecklistItem = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
    const toastId = toast.loading('Đang xóa...');
    try {
      const res = await fetch('/api/shift-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', item: { id } })
      });
      if (res.ok) {
        toast.success('Xóa thành công', { id: toastId });
        fetchChecklist();
      } else {
        toast.error('Lỗi xóa', { id: toastId });
      }
    } catch (e) {
      toast.error('Lỗi mạng', { id: toastId });
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
        <button 
          onClick={() => setActiveSubTab('new')} 
          style={{ padding: '8px 16px', borderRadius: 8, background: activeSubTab === 'new' ? 'var(--primary-color)' : 'transparent', color: activeSubTab === 'new' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <CheckSquare size={18} /> Giao ca mới
        </button>
        <button 
          onClick={() => setActiveSubTab('history')} 
          style={{ padding: '8px 16px', borderRadius: 8, background: activeSubTab === 'history' ? 'var(--primary-color)' : 'transparent', color: activeSubTab === 'history' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <History size={18} /> Lịch sử
        </button>
        <button 
          onClick={() => setActiveSubTab('admin')} 
          style={{ padding: '8px 16px', borderRadius: 8, background: activeSubTab === 'admin' ? 'var(--primary-color)' : 'transparent', color: activeSubTab === 'admin' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <Settings size={18} /> Quản lý Checklist
        </button>
      </div>

      {activeSubTab === 'new' && (
        <div className="card-glass" style={{ padding: '32px 40px' }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>Thông tin Giao ca</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Ca làm việc</label>
              <select 
                value={currentShift} 
                onChange={(e) => {
                  setCurrentShift(Number(e.target.value) as ShiftType);
                  setCheckedItems({});
                  setDraftId(undefined);
                }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}
              >
                <option value={1}>Ca 1</option>
                <option value={2}>Ca 2</option>
                <option value={3}>Ca 3</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Ngày giao ca</label>
              <input 
                type="date" 
                value={handoverDate} 
                onChange={e => setHandoverDate(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Người bàn giao</label>
              <input 
                type="text" 
                value={user?.name || ''} 
                disabled 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#e2e8f0', color: '#64748b' }} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Nội dung tồn bàn giao ca</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Ghi chú lại các công việc chưa xong, cần lưu ý cho ca sau..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 100 }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Checklist công việc</h2>
            <button 
              onClick={handleCheckAll}
              className="btn-action btn-outline" 
              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
            >
              <CheckSquare size={16} /> Chọn tất cả
            </button>
          </div>

          {loadingItems ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin-anim" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
              {checklistItems.map((item, index) => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={!!checkedItems[item.id]} 
                    onChange={() => handleToggleCheck(item.id)} 
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: '1.05rem', color: checkedItems[item.id] ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: checkedItems[item.id] ? 'line-through' : 'none' }}>
                    {index + 1}. {item.content}
                  </span>
                </label>
              ))}
              {checklistItems.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Chưa có công việc nào cho ca này.</p>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button 
              onClick={() => handleSave('draft')} 
              disabled={isSaving}
              style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              {isSaving ? <Loader2 size={18} className="spin-anim" /> : <Save size={18} />} Lưu nháp
            </button>
            <button 
              onClick={() => handleSave('completed')} 
              disabled={isSaving}
              className="btn-export"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {isSaving ? <Loader2 size={18} className="spin-anim" /> : <Send size={18} />} Ký & Bàn giao
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="card-glass" style={{ padding: '32px 40px' }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>Lịch sử Phiếu Giao Ca</h2>
          
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin-anim" /></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Ca làm việc</th>
                    <th>Người bàn giao</th>
                    <th>Trạng thái</th>
                    <th>Tồn đọng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(record => (
                    <tr key={record.id}>
                      <td>{new Date(record.handover_date).toLocaleDateString('vi-VN')}</td>
                      <td><strong>Ca {record.shift_type}</strong></td>
                      <td>{record.user_name}</td>
                      <td>
                        {record.status === 'completed' ? (
                          <span className="status-badge success">Đã chốt</span>
                        ) : (
                          <span className="status-badge warning">Đang nháp</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {record.notes || '-'}
                      </td>
                      <td>
                        {record.status === 'draft' && record.user_name === user?.name ? (
                          <button onClick={() => loadDraft(record)} className="btn-action btn-outline" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>Tiếp tục</button>
                        ) : (
                          <button onClick={() => alert('Chức năng xem chi tiết đang phát triển')} className="btn-action btn-outline" style={{ padding: '4px 12px', fontSize: '0.85rem', color: '#64748b', borderColor: '#cbd5e1' }}>Xem</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Chưa có lịch sử giao ca.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'admin' && (
        <div className="card-glass" style={{ padding: '32px 40px' }}>
          <h2 className="section-title" style={{ marginBottom: 24 }}>Quản lý Checklist</h2>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Tên công việc mới</label>
              <input 
                type="text" 
                value={adminItemContent}
                onChange={e => setAdminItemContent(e.target.value)}
                placeholder="Nhập nội dung công việc..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ width: 150 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Áp dụng cho</label>
              <select 
                value={adminShiftType}
                onChange={e => setAdminShiftType(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              >
                <option value={0}>Tất cả các ca</option>
                <option value={1}>Chỉ Ca 1</option>
                <option value={2}>Chỉ Ca 2</option>
                <option value={3}>Chỉ Ca 3</option>
              </select>
            </div>
            <button 
              onClick={handleAddChecklistItem}
              className="btn-export"
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
            >
              <Plus size={18} /> Thêm việc
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nội dung công việc</th>
                  <th>Áp dụng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.content}</td>
                    <td>
                      {item.shift_type === 0 ? <span className="status-badge" style={{ background: '#e2e8f0', color: '#475569' }}>Cả 3 ca</span> : <span className="status-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>Ca {item.shift_type}</span>}
                    </td>
                    <td>{item.is_active ? 'Đang bật' : 'Đã ẩn'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleDeleteChecklistItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error-text)', cursor: 'pointer', padding: 8 }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
