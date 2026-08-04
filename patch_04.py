import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add form4 state
form4_state = '''  const [form4, setForm4] = useState({
    title: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: ''
  });'''
content = content.replace('  const [form3a, setForm3a] = useState({', form4_state + '\n  const [form3a, setForm3a] = useState({')

# 2. Add '04_Mau_Thong_bao' to reportTypes
report_type = "  { id: '04_Mau_Thong_bao', name: 'Mẫu Thông báo' },\n  { id: '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len',"
content = content.replace("  { id: '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len',", report_type)

# 3. Add handleExport4
handle_export_4 = '''  const handleExport4 = async () => {
    try {
      const response = await fetch('/api/export-04', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form4)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Thong_bao_04.docx';
        a.click();
      } else {
        alert('Có lỗi xảy ra khi tạo file Word');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };'''
content = content.replace('  const handleExport3a = async () => {', handle_export_4 + '\n\n  const handleExport3a = async () => {')

# 4. Add to export button
content = content.replace(
    "else if (activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len') handleExport3a();",
    "else if (activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len') handleExport3a();\n                    else if (activeReportKey === '04_Mau_Thong_bao') handleExport4();"
)

# 5. Add form UI
form3a_ui_match = re.search(r"(activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' \? \([\s\S]*?\)) : \(", content)
if form3a_ui_match:
    form3a_ui = form3a_ui_match.group(1)
    # Remove the `to` (Kính gửi) textarea for form4
    form4_ui = form3a_ui.replace("'03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len'", "'04_Mau_Thong_bao'").replace('form3a', 'form4').replace('setForm3a', 'setForm4')
    form4_ui = re.sub(r"<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>\s*<label style={{ fontWeight: 500, color: '#334155' }}>Nơi nhận \(Kính gửi\).*?</textarea>\s*</div>", "", form4_ui, flags=re.DOTALL)
    
    content = content.replace(
        "activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' ?",
        f"{form4_ui} : activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' ?"
    )

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
