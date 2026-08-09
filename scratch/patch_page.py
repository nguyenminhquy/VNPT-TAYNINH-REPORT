import re

with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's use string operations instead of regex to be safe.
start_str = "              {activeTab === 'petition' ? ("
end_str = "              ) : activeTab === 'handover' ? ("

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    replacement = """              {activeTab === 'petition' ? (
                <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                  <DocumentEditor 
                    initialContent={activeReportKey === '02_Mau_To_trinh' ? template02ToTrinh : '<p>Chưa có mẫu cho file này. Chọn "Mẫu Tờ trình" để xem demo.</p>'} 
                    title={PETITION_TEMPLATES.find(t => t.id === activeReportKey)?.name || 'Văn bản hành chính'} 
                  />
                </div>
"""
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    # We also need to add imports
    import_str = """import { upload } from '@vercel/blob/client';
import DocumentEditor from "@/components/DocumentEditor";
import { template02ToTrinh } from "@/templates/02_Mau_To_trinh";"""
    
    new_content = new_content.replace("import { upload } from '@vercel/blob/client';", import_str)
    
    with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched page.tsx successfully!")
else:
    print("Could not find the pattern in page.tsx")
