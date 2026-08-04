import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_form9 = """  const [form9, setForm9] = useState({
    nguoiUyQuyen: '',
    nguoiDuocUyQuyen: '',
    noiDungUyQuyen: ''
  });"""

replace_form9 = """  const [form9, setForm9] = useState({
    nguoiUyQuyen: '',
    nguoiDuocUyQuyen: '',
    noiDungUyQuyen: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });"""

content = content.replace(search_form9, replace_form9)

search_export9 = """  const handleExport9 = async () => {
    try {
      const payload = {
        ...form9,
        role: role.includes('GIÁM ĐỐC') ? role : 'GIÁM ĐỐC',
        signerName,
        unit8,
        author9
      };"""

replace_export9 = """  const handleExport9 = async () => {
    try {
      const payload = {
        ...form9,
        role: form9.role.includes('GIÁM ĐỐC') ? form9.role : 'GIÁM ĐỐC'
      };"""

content = content.replace(search_export9, replace_export9)

search_ui = """                      <Button onClick={handleExport9} className="w-full bg-[#0066cc] hover:bg-[#0052a3]">
                        <Download className="mr-2 h-4 w-4" /> Xuất file Mẫu 09
                      </Button>
                    </div>
                  )}"""

replace_ui = """                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <Label>Chức vụ người ủy quyền (6)</Label>
                          <select value={form9.role} onChange={e => setForm9(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                            <option value="GIÁM ĐỐC">GIÁM ĐỐC</option>
                            <option value="PHÓ GIÁM ĐỐC">PHÓ GIÁM ĐỐC</option>
                          </select>
                        </div>
                        <div>
                          <Label>Người ký</Label>
                          <input type="text" value={form9.signerName} onChange={e => setForm9(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <Label>Đơn vị (7)</Label>
                          <input type="text" value={form9.unit8} onChange={e => setForm9(p => ({ ...p, unit8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                        </div>
                        <div>
                          <Label>Người soạn (8)</Label>
                          <input type="text" value={form9.author9} onChange={e => setForm9(p => ({ ...p, author9: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                        </div>
                      </div>
                      <Button onClick={handleExport9} className="w-full bg-[#0066cc] hover:bg-[#0052a3]">
                        <Download className="mr-2 h-4 w-4" /> Xuất file Mẫu 09
                      </Button>
                    </div>
                  )}"""

content = content.replace(search_ui, replace_ui)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed page.tsx for form9")
