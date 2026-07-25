"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Save, ArrowLeft, ArrowRight, CheckCircle, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { startOfISOWeek, endOfISOWeek, addWeeks, subWeeks, getISOWeek, getYear, format, setISOWeek, setYear } from 'date-fns';
import * as XLSX from 'xlsx';

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

  const handleExportExcel = () => {
    try {
      const exportData = SHIFTS.map(shift => {
        const rowData: Record<string, string> = {
          'Ca / Ngày': shift
        };
        
        DAYS.forEach((day, idx) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + idx);
          const dateStr = format(d, 'dd/MM/yyyy');
          const header = `${DAY_LABELS[idx]} (${dateStr})`;
          
          const assigned = scheduleData[day]?.[shift] || [];
          const is3Slot = ['Sáng', 'Chiều', 'Tối'].includes(shift);
          
          if (is3Slot) {
            const getU = (p: string) => {
              for (const item of assigned) {
                const name = typeof item === 'string' ? item.split('|')[0] : (typeof item === 'object' ? (item as any).name : item);
                const pos = typeof item === 'string' ? (item.split('|')[1] || '') : (typeof item === 'object' ? (item as any).pos || '' : '');
                if (pos === p) return name;
              }
              return '';
            };
            const c1 = getU('Ca 1');
            const c2 = getU('Ca 2');
            const c3 = getU('Ca 3');
            const parts = [];
            if (c1) parts.push(`Ca 1: ${c1}`);
            if (c2) parts.push(`Ca 2: ${c2}`);
            if (c3) parts.push(`Ca 3: ${c3}`);
            rowData[header] = parts.length > 0 ? parts.join(' | ') : '(Trống)';
          } else {
            const assignedStrings = assigned.map(item => {
              const name = typeof item === 'string' ? item.split('|')[0] : item;
              const pos = typeof item === 'string' ? (item.split('|')[1] || '') : '';
              return pos ? `${name} (${pos})` : name;
            });
            rowData[header] = assignedStrings.join(', ');
          }
        });
        
        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const cols = [{ wch: 15 }]; // Ca / Ngày
      for (let i = 0; i < 7; i++) cols.push({ wch: 25 }); // 7 days
      worksheet['!cols'] = cols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `T${weekNumber}_${year}`);
      
      XLSX.writeFile(workbook, `LichTrucTuan_T${weekNumber}_${year}.xlsx`);
      toast.success('Xuất file Excel thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xuất file!');
    }
  };

  const getUserPos = (day: string, shift: string, userName: string) => {
    const assigned = scheduleData[day]?.[shift] || [];
    for (const item of assigned) {
      if (typeof item === 'string') {
        const [name, pos] = item.split('|');
        if (name === userName) return pos || 'Không';
      } else if (item && typeof item === 'object' && (item as any).name === userName) {
        return (item as any).pos || 'Không';
      } else if (item === userName) {
        return 'Không';
      }
    }
    return null; // Not assigned
  };

  const getSlotUser = (day: string, shift: string, pos: string) => {
    const assigned = scheduleData[day]?.[shift] || [];
    for (const item of assigned) {
      const name = typeof item === 'string' ? item.split('|')[0] : (typeof item === 'object' ? (item as any).name : item);
      const p = typeof item === 'string' ? (item.split('|')[1] || '') : (typeof item === 'object' ? (item as any).pos || '' : '');
      if (p === pos) return name;
    }
    return '';
  };

  const handleSetUserPos = (userName: string, pos: string) => {
    if (!activeCell) return;
    setScheduleData(prev => {
      const newData = { ...prev };
      if (!newData[activeCell.day]) newData[activeCell.day] = {};
      const currentAssigned = newData[activeCell.day][activeCell.shift] || [];
      
      // Remove existing entry for this user OR for this pos if it's a 3-slot shift and pos is Ca 1/2/3
      const is3Slot = ['Sáng', 'Chiều', 'Tối'].includes(activeCell.shift);
      const filtered = currentAssigned.filter(item => {
        const name = typeof item === 'string' ? item.split('|')[0] : (typeof item === 'object' ? (item as any).name : item);
        const p = typeof item === 'string' ? (item.split('|')[1] || '') : (typeof item === 'object' ? (item as any).pos || '' : '');
        if (name === userName) return false;
        if (is3Slot && ['Ca 1', 'Ca 2', 'Ca 3'].includes(pos) && p === pos) return false;
        return true;
      });

      if (pos && pos !== 'Remove') {
        const posVal = pos === 'Không' ? '' : pos;
        filtered.push(`${userName}|${posVal}`);
      }

      newData[activeCell.day][activeCell.shift] = filtered;
      return newData;
    });
  };

  const isUserInCell = (day: string, shift: string, userName: string) => {
    return getUserPos(day, shift, userName) !== null;
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
              onClick={handleExportExcel}
              className="btn-action btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}
            >
              <Download size={16} /> Xuất Excel
            </button>
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
                        const isUserAssigned = highlightedUser ? isUserInCell(day, shift, highlightedUser) : false;
                        
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

                        const is3Slot = ['Sáng', 'Chiều', 'Tối'].includes(shift);

                        return (
                          <td 
                            key={`${day}-${shift}`} 
                            style={{ 
                              padding: 6, 
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
                            {is3Slot ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 64 }}>
                                {['Ca 1', 'Ca 2', 'Ca 3'].map(slot => {
                                  const slotUser = getSlotUser(day, shift, slot);
                                  const isHighlight = highlightedUser && slotUser === highlightedUser;
                                  
                                  let slotBg = '#f8fafc';
                                  let slotColor = '#334155';
                                  let labelColor = '#64748b';
                                  
                                  if (isHighlight) {
                                    slotBg = '#22c55e';
                                    slotColor = '#fff';
                                    labelColor = '#fff';
                                  } else if (slotUser) {
                                    if (slot === 'Ca 1') { slotBg = '#eff6ff'; slotColor = '#1e40af'; labelColor = '#3b82f6'; }
                                    else if (slot === 'Ca 2') { slotBg = '#fef9c3'; slotColor = '#854d0e'; labelColor = '#eab308'; }
                                    else if (slot === 'Ca 3') { slotBg = '#f3e8ff'; slotColor = '#6b21a8'; labelColor = '#a855f7'; }
                                  }

                                  return (
                                    <div 
                                      key={slot} 
                                      style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '3px 6px', borderRadius: 4, background: slotBg, 
                                        border: slotUser && !isHighlight ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                                        fontSize: '0.8rem' 
                                      }}
                                    >
                                      <span style={{ fontWeight: 700, color: labelColor, fontSize: '0.75rem' }}>{slot}:</span>
                                      <span style={{ fontWeight: 600, color: slotColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }}>
                                        {slotUser || <i style={{ color: '#cbd5e1', fontWeight: 400 }}>--</i>}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 60, alignContent: 'flex-start' }}>
                                {assigned.map(item => {
                                  const name = typeof item === 'string' ? item.split('|')[0] : (typeof item === 'object' ? (item as any).name : item);
                                  const pos = typeof item === 'string' ? (item.split('|')[1] || '') : (typeof item === 'object' ? (item as any).pos || '' : '');
                                  
                                  const isHighlight = highlightedUser && name === highlightedUser;
                                  
                                  let bg = isHighlight ? '#22c55e' : '#e2e8f0';
                                  let color = isHighlight ? '#fff' : '#334155';
                                  
                                  if (!isHighlight && pos) {
                                    if (pos === 'Ca 1') { bg = '#dbeafe'; color = '#1e40af'; }
                                    else if (pos === 'Ca 2') { bg = '#fef9c3'; color = '#854d0e'; }
                                    else if (pos === 'Ca 3') { bg = '#f3e8ff'; color = '#6b21a8'; }
                                    else if (pos === 'Trưởng ca') { bg = '#ffe4e6'; color = '#be123c'; }
                                  }

                                  return (
                                    <span 
                                      key={name}
                                      style={{ 
                                        padding: '4px 8px', 
                                        background: bg, 
                                        color: color,
                                        borderRadius: 4, 
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      {name}
                                      {pos && <span style={{ fontSize: '0.75rem', opacity: 0.9, background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 3 }}>{pos}</span>}
                                    </span>
                                  );
                                })}
                                {assigned.length === 0 && (
                                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic', margin: 'auto' }}>(Trống)</span>
                                )}
                              </div>
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
                
                <div style={{ padding: 16, maxHeight: 420, overflowY: 'auto' }}>
                  {['Sáng', 'Chiều', 'Tối'].includes(activeCell.shift) ? (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16, fontWeight: 600 }}>Chỉ định nhân sự theo vị trí ca:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {['Ca 1', 'Ca 2', 'Ca 3'].map(slot => {
                          const currentUser = getSlotUser(activeCell.day, activeCell.shift, slot);
                          let bg = '#eff6ff'; let border = '#bfdbfe'; let labelCol = '#1e40af';
                          if (slot === 'Ca 2') { bg = '#fef9c3'; border = '#fde047'; labelCol = '#854d0e'; }
                          else if (slot === 'Ca 3') { bg = '#f3e8ff'; border = '#d8b4fe'; labelCol = '#6b21a8'; }

                          return (
                            <div key={slot} style={{ background: bg, padding: 12, borderRadius: 8, border: `1px solid ${border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label style={{ fontWeight: 700, color: labelCol, fontSize: '0.9rem', margin: 0 }}>
                                  {slot} {slot === 'Ca 1' ? '(Vô tuyến)' : slot === 'Ca 2' ? '(Truyền dẫn)' : '(Mạng lõi/OMC)'}:
                                </label>
                                {currentUser && (
                                  <button 
                                    onClick={() => handleSetUserPos(currentUser, 'Remove')}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                              <select
                                value={currentUser || ''}
                                onChange={e => {
                                  if (currentUser) handleSetUserPos(currentUser, 'Remove');
                                  if (e.target.value) handleSetUserPos(e.target.value, slot);
                                }}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', fontWeight: 600, outline: 'none', fontSize: '0.9rem' }}
                              >
                                <option value="">-- Chọn nhân sự --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>Chọn nhân sự và chỉ định vị trí ca:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {users.map(u => {
                          const currentPos = getUserPos(activeCell.day, activeCell.shift, u.name);
                          const isSelected = currentPos !== null;
                          return (
                            <div 
                              key={u.id}
                              style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', 
                                borderRadius: 6,
                                background: isSelected ? '#f0f9ff' : '#f8fafc',
                                border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                                transition: 'all 0.1s'
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, margin: 0 }}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) handleSetUserPos(u.name, 'Remove');
                                    else handleSetUserPos(u.name, 'Không');
                                  }}
                                  style={{ width: 16, height: 16, accentColor: 'var(--primary-color)' }}
                                />
                                <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--primary-color)' : 'inherit' }}>
                                  {u.name}
                                </span>
                              </label>
                              
                              {isSelected && (
                                <select
                                  value={currentPos || 'Không'}
                                  onChange={e => handleSetUserPos(u.name, e.target.value)}
                                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff', color: '#1e293b', fontWeight: 600, outline: 'none' }}
                                >
                                  <option value="Không">Chung (Không chia)</option>
                                  <option value="Trưởng ca">Trưởng ca</option>
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
