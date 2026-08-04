import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """                  ) : activeReportKey === '04_Mau_Thong_bao' ? ("""

replace = """                  ) : activeReportKey === '09_Mau_Giay_uy_quyen' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người ủy quyền (3)</label>
                        <input type="text" placeholder="Họ tên, chức vụ, đơn vị công tác..." value={form9.nguoiUyQuyen} onChange={e => setForm9(p => ({ ...p, nguoiUyQuyen: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người được ủy quyền (4)</label>
                        <input type="text" placeholder="Họ tên, chức vụ, đơn vị công tác..." value={form9.nguoiDuocUyQuyen} onChange={e => setForm9(p => ({ ...p, nguoiDuocUyQuyen: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung ủy quyền (5)</label>
                        <textarea placeholder="Nhập nội dung ủy quyền..." value={form9.noiDungUyQuyen} onChange={e => setForm9(p => ({ ...p, noiDungUyQuyen: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Chức vụ người ủy quyền (6)</label>
                        <select value={form9.role} onChange={e => setForm9(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', height: '42px' }}>
                          <option value="GIÁM ĐỐC">GIÁM ĐỐC</option>
                          <option value="PHÓ GIÁM ĐỐC">PHÓ GIÁM ĐỐC</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người ký</label>
                        <input type="text" value={form9.signerName} onChange={e => setForm9(p => ({ ...p, signerName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị (7)</label>
                        <input type="text" value={form9.unit8} onChange={e => setForm9(p => ({ ...p, unit8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Người soạn (8)</label>
                        <input type="text" value={form9.author9} onChange={e => setForm9(p => ({ ...p, author9: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
                        <button onClick={handleExport9} style={{ width: '100%', padding: '14px', background: '#0066cc', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Xuất file Mẫu 09
                        </button>
                      </div>
                    </div>
                  ) : activeReportKey === '04_Mau_Thong_bao' ? ("""

if search in content:
    content = content.replace(search, replace)
    with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI for Mau 09 successfully added")
else:
    print("Could not find search string in page.tsx")
