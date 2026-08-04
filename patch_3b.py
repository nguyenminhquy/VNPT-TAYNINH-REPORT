import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add form3b state
form3b_state = '''  const [form3b, setForm3b] = useState({
    title: '',
    to: '',
    content: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit6: '',
    author7: '',
    eoffice8: ''
  });'''
content = content.replace('  const [form3a, setForm3a] = useState({', form3b_state + '\n  const [form3a, setForm3a] = useState({')

# 2. Add '03b_Mau_Cong_van_gui_1_don_vi' to reportTypes
report_type = "  { id: '03b_Mau_Cong_van_gui_1_don_vi', name: 'Mẫu Công văn gửi 1 đơn vị' },\n  { id: '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len',"
content = content.replace("  { id: '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len',", report_type)

# 3. Add handleExport3b
handle_export_3b = '''  const handleExport3b = async () => {
    try {
      const response = await fetch('/api/export-3b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form3b)
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Cong_van_3b.docx';
        a.click();
      } else {
        alert('Có lỗi xảy ra khi tạo file Word');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };'''
content = content.replace('  const handleExport3a = async () => {', handle_export_3b + '\n\n  const handleExport3a = async () => {')

# 4. Add to export button
content = content.replace(
    "else if (activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len') handleExport3a();",
    "else if (activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len') handleExport3a();\n                    else if (activeReportKey === '03b_Mau_Cong_van_gui_1_don_vi') handleExport3b();"
)

# 5. Add form UI
form3a_ui_match = re.search(r"(activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' \? \([\s\S]*?\)) : \(", content)
if form3a_ui_match:
    form3a_ui = form3a_ui_match.group(1)
    form3b_ui = form3a_ui.replace("'03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len'", "'03b_Mau_Cong_van_gui_1_don_vi'").replace('form3a', 'form3b').replace('setForm3a', 'setForm3b')
    content = content.replace(
        "activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' ?",
        f"{form3b_ui} : activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' ?"
    )

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
