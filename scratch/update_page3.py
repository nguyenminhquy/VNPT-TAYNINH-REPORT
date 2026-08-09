import re

def patch_file():
    with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the start index of the second {activeTab === 'petition' && (
    parts = content.split("{activeTab === 'petition' && (")
    if len(parts) < 3:
        print("Could not find the second occurrence of {activeTab === 'petition' && (")
        return

    # The string up to the start of the block we want to replace
    prefix = parts[0] + "{activeTab === 'petition' && (" + parts[1]
    
    # The block we want to replace starts here
    block_start_idx = len(prefix)
    
    # We need to find the matching closing brace for this `{`
    # Wait, it's an expression `{activeTab === 'petition' && (`
    # so we actually need to match the parenthesis `(`
    # Let's count parentheses from block_start_idx
    open_parens = 1
    idx = block_start_idx
    while open_parens > 0 and idx < len(content):
        if content[idx] == '(':
            open_parens += 1
        elif content[idx] == ')':
            open_parens -= 1
        idx += 1
        
    if open_parens != 0:
        print("Could not find matching parenthesis")
        return
        
    # Now we also need to account for the closing `}` of the expression `{...}`
    # The expression was `{activeTab === 'petition' && (` so after the matching `)`, there should be a `}`
    while idx < len(content) and content[idx] in [' ', '\n', '\t']:
        idx += 1
        
    if idx < len(content) and content[idx] == '}':
        idx += 1
        
    block_end_idx = idx

    replacement = """{activeTab === 'petition' && (
              <div style={{ width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden', padding: '0', background: '#f3f4f6' }}>
                <DocumentEditor 
                  initialContent={activeReportKey === '02_Mau_To_trinh' ? template02ToTrinh : '<p style="text-align:center; margin-top:50px;">Chưa có mẫu cho file này. Chọn "Mẫu Tờ trình" ở menu bên trái để xem bản trình diễn.</p>'} 
                  title={PETITION_TEMPLATES.find(t => t.id === activeReportKey)?.name || 'Văn bản hành chính'} 
                />
              </div>
            )}"""

    new_content = prefix[:prefix.rfind("{activeTab === 'petition' && (")] + replacement + content[block_end_idx:]
    
    import_str = """import { upload } from '@vercel/blob/client';
import DocumentEditor from "@/components/DocumentEditor";
import { template02ToTrinh } from "@/templates/02_Mau_To_trinh";"""
    
    new_content = new_content.replace("import { upload } from '@vercel/blob/client';", import_str)
    
    with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched page.tsx successfully!")

patch_file()
