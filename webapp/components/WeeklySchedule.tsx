"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Save, ArrowLeft, ArrowRight, CheckCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { startOfISOWeek, endOfISOWeek, addWeeks, subWeeks, getISOWeek, getYear, format, setISOWeek, setYear } from 'date-fns';

const SHIFTS = ['Sáng', 'Chiều', 'Tối', 'HC', 'Học', 'P', 'CN', 'Khác'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export default function WeeklySchedule({ user }: { user: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [scheduleId, setScheduleId] = useState<string | undefined>(undefined);
  const [scheduleData, setScheduleData] = useState<Record<string, Record<string, string[]>>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [highlightedUser, setHighlightedUser] = useState<string>('');

  // Edit mode UI state
  const [activeCell, setActiveCell] = useState<{day: string, shift: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchSchedule(currentDate);
  }, [currentDate]);

  const year = getYear(currentDate);
  const weekNumber = getISOWeek(currentDate);
  const startDate = startOfISOWeek(currentDate);
  const endDate = endOfISOWeek(currentDate);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (res.ok) {
        setUsers(json.users || []);
        const me = (json.users || []).find((u: any) => u.email === user.email);
        if (me && me.is_admin) setIsAdmin(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedule = async (date: Date) => {
    setIsLoading(true);
    try {
      const y = getYear(date);
      const w = getISOWeek(date);
      const res = await fetch(`/api/schedules?year=${y}&week=${w}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      
      if (json.data) {
        setScheduleId(json.data.id);
        setScheduleData(json.data.schedule_data || {});
        setGeneralNotes(json.data.general_notes || '');
        setStatus(json.data.status || 'draft');
      } else {
        setScheduleId(undefined);
        setScheduleData({});
        setGeneralNotes('');
        setStatus('draft');
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true);
    try {
      const newStatus = publish ? 'published' : 'draft';
      
      const payload = {
        year,
        week_number: weekNumber,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        status: newStatus,
        schedule_data: scheduleData,
        general_notes: generalNotes
      };

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi lưu lịch');
      }
      
      toast.success(publish ? 'Đã ban hành lịch thành công!' : 'Đã lưu nháp lịch thành công!');
      setStatus(newStatus);
      setActiveCell(null);
    } catch (error: any) {
      toast.error(error.message);
    }
    setIsSaving(false);
  };

  const handleCopyPrevWeek = async () => {
    if (!confirm('Hành động này sẽ ghi đè lịch hiện tại bằng dữ liệu của tuần trước. Bạn có chắc chắn?')) return;
    
    setIsLoading(true);
    try {
      const payload = {
        year,
        week_number: weekNumber,
        action: 'copy'
      };

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi copy');
      }
      
      const json = await res.json();
      setScheduleData(json.data || {});
      toast.success('Đã sao chép lịch tuần trước');
    } catch (error: any) {
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  const handleCellClick = (day: string, shift: string) => {
    if (activeCell?.day === day && activeCell?.shift === shift) {
      setActiveCell(null);
    } else {
      setActiveCell({ day, shift });
    }
  };

  const handleToggleUser = (userName: string) => {
    if (!activeCell) return;
    
    setScheduleData(prev => {
      const newData = { ...prev };
      if (!newData[activeCell.day]) newData[activeCell.day] = {};
      
      const currentAssigned = newData[activeCell.day][activeCell.shift] || [];
      
      if (currentAssigned.includes(userName)) {
        newData[activeCell.day][activeCell.shift] = currentAssigned.filter(n => n !== userName);
      } else {
        newData[activeCell.day][activeCell.shift] = [...currentAssigned, userName];
      }
      
      return newData;
    });
  };

  const isUserInCell = (day: string, shift: string, userName: string) => {
    const assigned = scheduleData[day]?.[shift] || [];
    return assigned.includes(userName);
  };

  return (
    <div className="fade-in">
      <div className="card-glass" style={{ padding: '24px 32px' }}>
        
        {/* Header & Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={28} className="text-primary" /> 
              Lịch Trực Tuần {weekNumber} - {year}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Từ {format(startDate, 'dd/MM/yyyy')} đến {format(endDate, 'dd/MM/yyyy')}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="btn-action btn-outline" style={{ padding: '8px' }} title="Tuần trước"
            >
              <ArrowLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="btn-action btn-outline" style={{ padding: '8px 16px' }}
            >
              Tuần hiện tại
            </button>
            <button 
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="btn-action btn-outline" style={{ padding: '8px' }} title="Tuần sau"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Tra cứu lịch:</label>
              <select 
                value={highlightedUser} 
                onChange={e => setHighlightedUser(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }}
              >
                <option value="">-- Hiện tất cả --</option>
                {users.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
              
              {user?.name && (
                <button 
                  onClick={() => setHighlightedUser(highlightedUser === user.name ? '' : user.name)}
                  className="btn-action btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.85rem', background: highlightedUser === user.name ? '#dcfce7' : 'transparent', borderColor: highlightedUser === user.name ? '#22c55e' : '#cbd5e1', color: highlightedUser === user.name ? '#16a34a' : 'inherit' }}
                >
                  Lịch của tôi
                </button>
              )}
            </div>
            
            {status === 'draft' && (
              <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#d97706', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                Bản nháp
              </span>
            )}
            {status === 'published' && (
              <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                Đã ban hành
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={handleCopyPrevWeek}
              className="btn-action btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}
            >
              <Copy size={16} /> Copy tuần trước
            </button>
            <button 
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="btn-action"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', background: '#64748b' }}
            >
              {isSaving ? <Loader2 size={16} className="spin-anim" /> : <Save size={16} />} Lưu nháp
            </button>
            
            {isAdmin && (
              <button 
                onClick={() => handleSave(true)}
                disabled={isSaving || status === 'published'}
                className="btn-export"
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}
              >
                {isSaving ? <Loader2 size={16} className="spin-anim" /> : <CheckCircle size={16} />} Ban hành
              </button>
            )}
          </div>
        </div>

        {/* Schedule Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Loader2 size={32} className="spin-anim" style={{ margin: '0 auto', color: 'var(--primary-color)' }} /></div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            
            <div style={{ flex: 1, overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ width: 80, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>Ca \ Ngày</th>
                    {DAYS.map((day, idx) => {
                      const d = new Date(startDate);
                      d.setDate(d.getDate() + idx);
                      return (
                        <th key={day} style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', width: `${100/7}%` }}>
                          <div style={{ fontWeight: 600 }}>{DAY_LABELS[idx]}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>{format(d, 'dd/MM/yyyy')}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {SHIFTS.map(shift => (
                    <tr key={shift}>
                      <td style={{ fontWeight: 600, textAlign: 'center', background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>{shift}</td>
                      
                      {DAYS.map(day => {
                        const assigned = scheduleData[day]?.[shift] || [];
                        const isUserAssigned = highlightedUser ? assigned.includes(highlightedUser) : false;
                        
                        let cellBg = '#fff';
                        let cellBorder = '1px solid transparent';
                        let cellOpacity = 1;
                        
                        if (highlightedUser) {
                          if (isUserAssigned) {
                            cellBg = '#f0fdf4';
                            cellBorder = '2px solid #22c55e';
                          } else {
                            cellOpacity = 0.3;
                          }
                        }

                        const isActive = activeCell?.day === day && activeCell?.shift === shift;
                        if (isActive) {
                          cellBg = '#f0f9ff';
                          cellBorder = '2px solid #3b82f6';
                        }

                        return (
                          <td 
                            key={`${day}-${shift}`} 
                            style={{ 
                              padding: 8, 
                              verticalAlign: 'top', 
                              borderRight: '1px solid #e2e8f0', 
                              background: cellBg,
                              border: cellBorder,
                              opacity: cellOpacity,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minHeight: 80
                            }}
                            onClick={() => handleCellClick(day, shift)}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 60, alignContent: 'flex-start' }}>
                              {assigned.map(name => (
                                <span 
                                  key={name}
                                  style={{ 
                                    padding: '4px 8px', 
                                    background: (highlightedUser && name === highlightedUser) ? '#22c55e' : '#e2e8f0', 
                                    color: (highlightedUser && name === highlightedUser) ? '#fff' : '#334155',
                                    borderRadius: 4, 
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {name}
                                </span>
                              ))}
                              {assigned.length === 0 && (
                                <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic', margin: 'auto' }}>(Trống)</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Smart Multi-select Sidebar */}
            {activeCell && (
              <div className="fade-in" style={{ width: 280, background: '#fff', borderRadius: 12, border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>Phân ca</h4>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {DAY_LABELS[DAYS.indexOf(activeCell.day)]} - Ca {activeCell.shift}
                    </span>
                  </div>
                  <button onClick={() => setActiveCell(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>
                
                <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>Nhấp vào tên để thêm/xóa khỏi ca:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {users.map(u => {
                      const isSelected = isUserInCell(activeCell.day, activeCell.shift, u.name);
                      return (
                        <label 
                          key={u.id}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', 
                            borderRadius: 6, cursor: 'pointer',
                            background: isSelected ? '#f0f9ff' : '#f8fafc',
                            border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                            transition: 'all 0.1s'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleToggleUser(u.name)}
                            style={{ width: 16, height: 16, accentColor: 'var(--primary-color)' }}
                          />
                          <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--primary-color)' : 'inherit' }}>
                            {u.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                
                <div style={{ padding: 16, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={() => setActiveCell(null)} className="btn-action" style={{ width: '100%' }}>Xong</button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Ghi chú chung */}
        <div style={{ marginTop: 32 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ghi chú chung của tuần</label>
          <textarea 
            value={generalNotes}
            onChange={e => setGeneralNotes(e.target.value)}
            placeholder="Nhập các nhắc nhở, công việc phát sinh trong tuần..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }}
          />
        </div>

      </div>
    </div>
  );
}
