import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add form5 state
form5_state = '''  const [form5, setForm5] = useState({
    title: '',
    bases: '',
    article1: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });'''
content = content.replace('  const [form4, setForm4] = useState({', form5_state + '\n  const [form4, setForm4] = useState({')

# 2. Add '05_Mau_Quyet_dinh_quy_dinh_truc_tiep' to reportTypes
report_type = "  { id: '05_Mau_Quyet_dinh_quy_dinh_truc_tiep', name: 'Mẫu Quyết định' },\n  { id: '04_Mau_Thong_bao',"
content = content.replace("  { id: '04_Mau_Thong_bao',", report_type)

# 3. Add handleExport5
handle_export_5 = '''  const handleExport5 = async () => {
    try {
      const response = await fetch('/api/export-05', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form5)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Quyet_dinh_05.docx';
        a.click();
      } else {
        alert('Có lỗi xảy ra khi tạo file Word');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };'''
content = content.replace('  const handleExport4 = async () => {', handle_export_5 + '\n\n  const handleExport4 = async () => {')

# 4. Add to export button
content = content.replace(
    "else if (activeReportKey === '04_Mau_Thong_bao') handleExport4();",
    "else if (activeReportKey === '04_Mau_Thong_bao') handleExport4();\n                    else if (activeReportKey === '05_Mau_Quyet_dinh_quy_dinh_truc_tiep') handleExport5();"
)

# 5. Add form UI
form5_ui = '''                  ) : activeReportKey === '05_Mau_Quyet_dinh_quy_dinh_truc_tiep' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form5.title} onChange={e => setForm5(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ (5)</label>
                        <textarea value={form5.bases} onChange={e => setForm5(p => ({ ...p, bases: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung Điều 1 (6)</label>
                        <textarea value={form5.article1} onChange={e => setForm5(p => ({ ...p, article1: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức danh phê duyệt</label>
                        <select value={form5.role} onChange={e => setForm5(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          <option value="GIÁM ĐỐC">Giám đốc</option>
                          <option value="KT. GIÁM ĐỐC&#10;PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Tên Người Ký</label>
                        <input type="text" value={form5.signerName} onChange={e => setForm5(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nơi nhận (Lưu VT, ...)</label>
                        <input type="text" value={form5.unit8} onChange={e => setForm5(p => ({ ...p, unit8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người soạn thảo</label>
                        <input type="text" value={form5.author9} onChange={e => setForm5(p => ({ ...p, author9: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                    </div>'''

content = content.replace(
    "activeReportKey === '04_Mau_Thong_bao' ?",
    f"activeReportKey === '04_Mau_Thong_bao' ? (\n"
)
content = content.replace(
    "                  ) : activeReportKey === '04_Mau_Thong_bao' ? (\n",
    form5_ui + "\n                  ) : activeReportKey === '04_Mau_Thong_bao' ? (\n"
)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
