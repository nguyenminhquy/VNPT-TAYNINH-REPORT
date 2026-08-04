import sys

content = open('webapp/app/page.tsx', 'r', encoding='utf-8').read()

# Add activeTab type
content = content.replace('"monthly_details" | "weekly_mll" | "special5" | "petition" | "handover" | "inspection" | "generator" | "schedule"', '"monthly_details" | "weekly_mll" | "special5" | "petition" | "handover" | "inspection" | "generator" | "schedule" | "form3a"')

# Add form state
form_state = '''
  // Mẫu 3a form state
  const [form3a, setForm3a] = useState({
    title: '',
    to: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: ''
  });
'''
content = content.replace('// Mẫu Báo Cáo form state', form_state + '\n  // Mẫu Báo Cáo form state')

# Add handleExport3a
handler = '''
  const handleExport3a = async () => {
    setIsExporting(true);
    const exportToast = toast.loading("Đang xuất Mẫu 3a...");
    try {
      const res = await fetch("/api/export-3a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form3a)
      });
      if (!res.ok) {
        toast.error("Lỗi tạo Word", { id: exportToast });
        setIsExporting(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cong_van_3a.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Xuất Mẫu 3a thành công!", { id: exportToast });
    } catch (e) {
      toast.error("Lỗi mạng", { id: exportToast });
    } finally {
      setIsExporting(false);
    }
  };
'''
content = content.replace('const handleExportBaoCao = async () => {', handler + '\n  const handleExportBaoCao = async () => {')

# Add tab button
tab_btn = '''
            <button
              onClick={() => setActiveTab('form3a')}
              style={{
                flex: '1 1 auto',
                padding: '12px 16px',
                border: 'none',
                background: activeTab === 'form3a' ? '#3b82f6' : 'transparent',
                color: activeTab === 'form3a' ? 'white' : '#64748b',
                fontWeight: activeTab === 'form3a' ? 600 : 500,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Mẫu 3a
            </button>
'''
content = content.replace('Mẫu Tờ trình\n            </button>', 'Mẫu Tờ trình\n            </button>' + tab_btn)

# Add Form UI
form_ui = '''
          {activeTab === 'form3a' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 8, background: '#e0e7ff', color: '#4f46e5', borderRadius: 8 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    Soạn Công văn (Mẫu 3a)
                  </h2>
                  <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 46px' }}>Điền thông tin xuất Mẫu Công văn gửi từ 2 đơn vị trở lên (03a)</p>
                </div>
                <button
                  onClick={handleExport3a}
                  disabled={isExporting}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: isExporting ? 0.7 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {isExporting ? 'Đang xuất...' : 'Xuất File Word'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                  <input type="text" value={form3a.title} onChange={e => setForm3a(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Kính gửi (mỗi đơn vị một dòng)</label>
                  <textarea value={form3a.to} onChange={e => setForm3a(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                  <textarea value={form3a.content} onChange={e => setForm3a(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                    <select value={form3a.role} onChange={e => setForm3a(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                      <option value="GIÁM ĐỐC">Giám đốc</option>
                      <option value="KT. GIÁM ĐỐC\nPHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                    <input type="text" value={form3a.signerName} onChange={e => setForm3a(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                    <input type="text" value={form3a.unit6} onChange={e => setForm3a(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                    <input type="text" value={form3a.author7} onChange={e => setForm3a(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice</label>
                    <input type="text" value={form3a.eoffice8} onChange={e => setForm3a(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
'''
content = content.replace("{activeTab === 'bao_cao' && (", form_ui + '\n          {activeTab === \'bao_cao\' && (')

open('webapp/app/page.tsx', 'w', encoding='utf-8').write(content)
