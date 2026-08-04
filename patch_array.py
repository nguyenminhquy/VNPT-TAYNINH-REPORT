import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change form5 state
state_search = """  const [form5, setForm5] = useState({
    title: '',
    bases: '',
    article1: '',
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });"""
state_replace = """  const [form5, setForm5] = useState({
    title: '',
    bases: [''],
    articles: [''],
    role: 'GIÁM ĐỐC',
    signerName: '',
    unit8: '',
    author9: ''
  });"""
content = content.replace(state_search, state_replace)

# Change handleExport5
handle_export_search = """  const handleExport5 = async () => {
    try {
      const response = await fetch('/api/export-05', {"""

handle_export_replace = """  const handleExport5 = async () => {
    try {
      const formattedBases = form5.bases.filter(b => b.trim()).map((b, i) => form5.bases.length === 1 ? `Căn cứ ${b}` : `- Căn cứ ${b}`).join('\\n');
      const formattedArticles = form5.articles.filter(a => a.trim()).map((a, i) => `Điều ${i + 1}. ${a}`).join('\\n');
      const payload = {
        ...form5,
        bases: formattedBases,
        article1: formattedArticles
      };
      
      const response = await fetch('/api/export-05', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });"""
content = content.replace(handle_export_search + "\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(form5)\n      });", handle_export_replace)

# Change form5 UI
ui_search = """                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ (5)</label>
                        <textarea value={form5.bases} onChange={e => setForm5(p => ({ ...p, bases: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>Nội dung Điều 1 (6)</label>
                        <textarea value={form5.article1} onChange={e => setForm5(p => ({ ...p, article1: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 120 }} />
                      </div>"""

ui_replace = """                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Căn cứ (5)</label>
                          <button onClick={() => setForm5(p => ({ ...p, bases: [...p.bases, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Căn cứ</button>
                        </div>
                        {form5.bases.map((base, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={base} onChange={e => {
                              const newBases = [...form5.bases];
                              newBases[idx] = e.target.value;
                              setForm5(p => ({ ...p, bases: newBases }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 60 }} placeholder={`Nội dung căn cứ ${idx + 1}`} />
                            {form5.bases.length > 1 && (
                              <button onClick={() => {
                                const newBases = form5.bases.filter((_, i) => i !== idx);
                                setForm5(p => ({ ...p, bases: newBases }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Các Điều (6)</label>
                          <button onClick={() => setForm5(p => ({ ...p, articles: [...p.articles, ''] }))} type="button" style={{ padding: '4px 8px', borderRadius: 4, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#334155' }}>+ Thêm Điều</button>
                        </div>
                        {form5.articles.map((article, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <textarea value={article} onChange={e => {
                              const newArticles = [...form5.articles];
                              newArticles[idx] = e.target.value;
                              setForm5(p => ({ ...p, articles: newArticles }));
                            }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', minHeight: 80 }} placeholder={`Nội dung Điều ${idx + 1}`} />
                            {form5.articles.length > 1 && (
                              <button onClick={() => {
                                const newArticles = form5.articles.filter((_, i) => i !== idx);
                                setForm5(p => ({ ...p, articles: newArticles }));
                              }} type="button" style={{ padding: '0 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                            )}
                          </div>
                        ))}
                      </div>"""

content = content.replace(ui_search, ui_replace)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated page.tsx")
