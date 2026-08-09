import re

def patch_file():
    with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    start_str = "           {/* TAB PETITION -> TO TRINH */}"
    end_str = "           {/* TAB HANDOVER */}"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find start or end strings")
        return
        
    replacement = """           {/* TAB PETITION -> TO TRINH */}
           {activeTab === 'petition' && (
             <div style={{ width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden', padding: '0', background: '#f3f4f6' }}>
               <DocumentEditor 
                 initialContent={activeReportKey === '02_Mau_To_trinh' ? template02ToTrinh : '<p style="text-align:center; margin-top:50px;">Chưa có mẫu cho file này. Chọn "Mẫu Tờ trình" ở menu bên trái để xem bản trình diễn.</p>'} 
                 title={PETITION_TEMPLATES.find(t => t.id === activeReportKey)?.name || 'Văn bản hành chính'} 
               />
             </div>
           )}

"""

    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    # Replace sidebar nav text for Demo Tờ trình
    old_nav_text = """<button className={`nav-item ${activeTab === 'petition' ? 'active' : ''}`} onClick={() => { setActiveTab('petition'); if (activeTab !== 'petition') setActiveReportKey('02_Mau_To_trinh'); }}>
              Tạo Tờ Trình
            </button>"""
    new_nav_text = """<button className={`nav-item ${activeTab === 'petition' ? 'active' : ''}`} onClick={() => { setActiveTab('petition'); if (activeTab !== 'petition') setActiveReportKey('02_Mau_To_trinh'); }}>
              Demo Tờ trình
            </button>"""
    new_content = new_content.replace(old_nav_text, new_nav_text)
    
    # Replace header title
    old_header = "{activeTab === 'petition' && '📄 Tạo Tờ Trình'}"
    new_header = "{activeTab === 'petition' && '📄 Demo Tờ trình'}"
    new_content = new_content.replace(old_header, new_header)

    import_str = """import { upload } from '@vercel/blob/client';
import DocumentEditor from "@/components/DocumentEditor";
import { template02ToTrinh } from "@/templates/02_Mau_To_trinh";"""
    
    new_content = new_content.replace("import { upload } from '@vercel/blob/client';", import_str)
    
    with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched page.tsx successfully!")

patch_file()
