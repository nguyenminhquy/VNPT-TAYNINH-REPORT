import re

def patch_file():
    with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace from:
    #            {activeTab === 'petition' && (
    # up to:
    #            {/* TAB HANDOVER */}
    
    start_str = "           {activeTab === 'petition' && ("
    end_str = "           {/* TAB HANDOVER */}"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find start or end strings")
        return
        
    replacement = """           {activeTab === 'petition' && (
             <div style={{ width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden', padding: '0', background: '#f3f4f6' }}>
               <DocumentEditor 
                 initialContent={activeReportKey === '02_Mau_To_trinh' ? template02ToTrinh : '<p style="text-align:center; margin-top:50px;">Chưa có mẫu cho file này. Chọn "Mẫu Tờ trình" ở menu bên trái để xem bản trình diễn.</p>'} 
                 title={PETITION_TEMPLATES.find(t => t.id === activeReportKey)?.name || 'Văn bản hành chính'} 
               />
             </div>
           )}

"""

    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    import_str = """import { upload } from '@vercel/blob/client';
import DocumentEditor from "@/components/DocumentEditor";
import { template02ToTrinh } from "@/templates/02_Mau_To_trinh";"""
    
    new_content = new_content.replace("import { upload } from '@vercel/blob/client';", import_str)
    
    with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched page.tsx successfully!")

patch_file()
