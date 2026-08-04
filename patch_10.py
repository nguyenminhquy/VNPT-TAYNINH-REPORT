import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to template list
search_list = "  { id: '09_Mau_Giay_uy_quyen', name: 'Mẫu Giấy ủy quyền' },"
replace_list = "  { id: '09_Mau_Giay_uy_quyen', name: 'Mẫu Giấy ủy quyền' },\n  { id: '10_Mau_Chi_thi', name: 'Mẫu Chỉ thị' },"

# Add state
search_state = "  const [form9, setForm9] = useState({ nguoiUyQuyen: '', nguoiDuocUyQuyen: '', noiDungUyQuyen: '', role: 'GIÁM ĐỐC', signerName: '', unit8: '', author9: '' });"
replace_state = "  const [form9, setForm9] = useState({ nguoiUyQuyen: '', nguoiDuocUyQuyen: '', noiDungUyQuyen: '', role: 'GIÁM ĐỐC', signerName: '', unit8: '', author9: '' });\n  const [form10, setForm10] = useState({ title: '', content: '', role: 'GIÁM ĐỐC', signerName: '', unit6: '', author7: '', eoffice8: '' });"

# Add handleExport10
search_export = "  const handleExport9 = async () => {"
replace_export = """  const handleExport10 = async () => {
    try {
      const response = await fetch('/api/export-10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form10),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chi_thi_10_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất file Mẫu 10');
    }
  };

  const handleExport9 = async () => {"""

# Add UI
search_ui = "                  ) : activeReportKey === '09_Mau_Giay_uy_quyen' ? ("
replace_ui = """                  ) : activeReportKey === '10_Mau_Chi_thi' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form10.title} onChange={e => setForm10(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                        <textarea value={form10.content} onChange={e => setForm10(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form10.role} onChange={e => setForm10(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form10.signerName} onChange={e => setForm10(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form10.unit6} onChange={e => setForm10(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form10.author7} onChange={e => setForm10(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form10.eoffice8} onChange={e => setForm10(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
                        <button onClick={handleExport10} style={{ width: '100%', padding: '14px', background: '#0066cc', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Xuất file Mẫu 10
                        </button>
                      </div>
                    </div>
                  ) : activeReportKey === '09_Mau_Giay_uy_quyen' ? ("""

content = content.replace(search_list, replace_list)
content = content.replace(search_state, replace_state)
content = content.replace(search_export, replace_export)
content = content.replace(search_ui, replace_ui)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
