import sys
import re

content = open('webapp/app/page.tsx', 'r', encoding='utf-8').read()

# 1. Remove the 'form3a' from activeTab type
content = content.replace('"monthly_details" | "weekly_mll" | "special5" | "petition" | "handover" | "inspection" | "generator" | "schedule" | "form3a"', '"monthly_details" | "weekly_mll" | "special5" | "petition" | "handover" | "inspection" | "generator" | "schedule"')

# 2. Remove the top-level form3a tab UI completely
# We know it starts with {activeTab === 'form3a' && ( and ends with a corresponding )}
# I will just regex it out carefully
match = re.search(r'\{\s*activeTab === \'form3a\'\s*&&\s*\([\s\S]*?\n\s*\)\s*\}', content)
if match:
    content = content[:match.start()] + content[match.end():]

# 3. Remove the tab button
content = re.sub(r'<button\s+onClick=\{\(\) => setActiveTab\(\'form3a\'\)\}[\s\S]*?Mẫu 3a\s*</button>', '', content)

# 4. Integrate into petition tab
form_ui = '''
                  ) : activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Về việc (Tiêu đề)</label>
                        <input type="text" value={form3a.title} onChange={e => setForm3a(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Kính gửi (mỗi đơn vị một dòng)</label>
                        <textarea value={form3a.to} onChange={e => setForm3a(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung chi tiết</label>
                        <textarea value={form3a.content} onChange={e => setForm3a(p => ({ ...p, content: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>
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
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Đơn vị lưu (Ví dụ: HT)</label>
                        <input type="text" value={form3a.unit6} onChange={e => setForm3a(p => ({ ...p, unit6: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Ký hiệu Người lập (Ví dụ: NTL)</label>
                        <input type="text" value={form3a.author7} onChange={e => setForm3a(p => ({ ...p, author7: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Số eOffice (Để trống nếu không có)</label>
                        <input type="text" value={form3a.eoffice8} onChange={e => setForm3a(p => ({ ...p, eoffice8: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                      </div>
                    </div>
'''
search_target = '''
                  ) : activeReportKey === '02_Mau_To_trinh' || !activeReportKey ? (
'''
replace_target = search_target.replace("|| !activeReportKey ?", "?")
content = content.replace(search_target, replace_target)

fallback_search = '''
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                       Mẫu này đang được cập nhật, chưa hỗ trợ điền tự động. Vui lòng sử dụng Mẫu Báo cáo hoặc Mẫu Tờ trình.
                    </div>
                  )}
'''
content = content.replace(fallback_search, form_ui + fallback_search)

# 5. Fix export button
export_button = '''<button className="btn-export" onClick={() => {
                    if (activeReportKey === '01_Mau_Bao_cao') handleExportMauBaoCao();
                    else if (activeReportKey === '03a_Mau_Cong_van_gui_tu_2_don_vi_tro_len') handleExport3a();
                    else handleExportToTrinh();
                  }} disabled={isExportingToTrinh}>'''
content = re.sub(r'<button className="btn-export" onClick=\{\(\) => \{\s*if \(activeReportKey === \'01_Mau_Bao_cao\'\) handleExportMauBaoCao\(\);\s*else handleExportToTrinh\(\);\s*\}\} disabled=\{isExportingToTrinh\}>', export_button, content)


open('webapp/app/page.tsx', 'w', encoding='utf-8').write(content)
print("Done!")
