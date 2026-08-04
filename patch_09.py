import os
import re

# 1. Create app/api/export-09/route.ts
os.makedirs('webapp/app/api/export-09', exist_ok=True)
route_content = """import { NextResponse } from 'next/server';
import { DocxModifier } from '@/lib/docx-modifier';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { nguoiUyQuyen, nguoiDuocUyQuyen, noiDungUyQuyen, role, signerName, unit8, author9 } = data;

    const templatePath = path.join(process.cwd(), 'templates', 'TOTRINH', '09_Mau_Giay_uy_quyen.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 500 });
    }

    const docBuffer = fs.readFileSync(templatePath);
    const doc = new DocxModifier(docBuffer);

    // (3) Ngư\u1eddi \u1ee7y quy\u1ec1n
    if (nguoiUyQuyen !== undefined) {
      doc.replaceTextInEntireDocument(/.*\\(\\s*3\\s*\\).*/, nguoiUyQuyen.trim() ? nguoiUyQuyen : '................................... (3) .................................. ');
    }

    // (4) Ngư\u1eddi đư\u1ee3c \u1ee7y quy\u1ec1n
    if (nguoiDuocUyQuyen !== undefined) {
      doc.replaceTextInEntireDocument(/.*\\(\\s*4\\s*\\).*/, nguoiDuocUyQuyen.trim() ? `Ông (bà): ${nguoiDuocUyQuyen}` : 'Ông (bà): ................................................(4)....................................................');
    }

    // (5) N\u1ed9i dung \u1ee7y quy\u1ec1n
    if (noiDungUyQuyen !== undefined) {
      // Get noiDungUyQuyen array to handle newlines
      let noiDungArray: string[] = [];
      if (Array.isArray(noiDungUyQuyen)) {
        noiDungArray = noiDungUyQuyen.filter((a: string) => a.trim());
      } else if (typeof noiDungUyQuyen === 'string' && noiDungUyQuyen.trim()) {
        noiDungArray = noiDungUyQuyen.split(/\\r?\\n|\\\\n/).filter((a: string) => a.trim());
      }

      if (noiDungArray.length > 0) {
        doc.replaceTextInEntireDocument(/.*\\(\\s*5\\s*\\).*/, noiDungArray[0]);
      } else {
        doc.replaceTextInEntireDocument(/.*\\(\\s*5\\s*\\).*/, '..........................................................(5)..................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................../.');
      }
    }

    // (6) Ch\u1ee9c v\u1ee5 ngư\u1eddi \u1ee7y quy\u1ec1n (role)
    if (role !== undefined) {
      doc.replaceTextInEntireDocument(/.*NGƯỜI ỦY QUYỀN.*\\(\\s*6\\s*\\).*/i, role.trim() ? role : 'NGƯỜI ỦY QUYỀN (6)');
    }

    // Signer name
    if (signerName !== undefined) {
      doc.replaceTextInEntireDocument(/.*H\u1ecd Và Tên.*/i, signerName.trim() ? signerName : '..............................');
    }

    // Replace unit (7) and author (8)
    if (unit8 !== undefined || author9 !== undefined) {
      const u = unit8?.trim() ? unit8 : '......';
      const a = author9?.trim() ? author9 : 'XX';
      doc.replaceTextInEntireDocument(/.*Lưu: VT.*\\(\\s*7\\s*\\).*\\(\\s*8\\s*\\).*/, `- Lưu: VT, ${u}. A. ${a}.`);
    }

    const outputBuffer = doc.getBuffer();

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Giay_Uy_Quyen_09.docx"',
      },
    });

  } catch (error: any) {
    console.error('Error generating Giay Uy Quyen 09:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
"""
with open('webapp/app/api/export-09/route.ts', 'w', encoding='utf-8') as f:
    f.write(route_content)

# 2. Update app/page.tsx
with open('webapp/app/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()

# Add form9 state
form_state_search = """  // Mẫu 04 form state"""
form_state_replace = """  // Mẫu 09 form state
  const [form9, setForm9] = useState({
    nguoiUyQuyen: '',
    nguoiDuocUyQuyen: '',
    noiDungUyQuyen: ''
  });

  // Mẫu 04 form state"""
page_content = page_content.replace(form_state_search, form_state_replace)

# Add export handler for form9
export_handler_search = """  const handleExport4 = async () => {"""
export_handler_replace = """  const handleExport9 = async () => {
    try {
      const payload = {
        ...form9,
        role: role.includes('GIÁM ĐỐC') ? role : 'GIÁM ĐỐC',
        signerName,
        unit8,
        author9
      };
      
      const response = await fetch('/api/export-09', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Giay_uy_quyen_09_${new Date().getTime()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Có lỗi xảy ra khi xuất file Mẫu 09');
    }
  };

  const handleExport4 = async () => {"""
page_content = page_content.replace(export_handler_search, export_handler_replace)

# Add UI rendering for form9
ui_search = """                  {selectedTemplate === '04_Mau_Thong_bao' && ("""
ui_replace = """                  {selectedTemplate === '09_Mau_Giay_uy_quyen' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Người ủy quyền (3)</Label>
                        <Input 
                          placeholder="Họ tên, chức vụ, đơn vị công tác..." 
                          value={form9.nguoiUyQuyen}
                          onChange={(e) => setForm9({...form9, nguoiUyQuyen: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Người được ủy quyền (4)</Label>
                        <Input 
                          placeholder="Họ tên, chức vụ, đơn vị công tác..." 
                          value={form9.nguoiDuocUyQuyen}
                          onChange={(e) => setForm9({...form9, nguoiDuocUyQuyen: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Nội dung ủy quyền (5)</Label>
                        <Textarea 
                          placeholder="Nhập nội dung ủy quyền..." 
                          className="min-h-[120px]"
                          value={form9.noiDungUyQuyen}
                          onChange={(e) => setForm9({...form9, noiDungUyQuyen: e.target.value})}
                        />
                      </div>
                      <Button onClick={handleExport9} className="w-full bg-[#0066cc] hover:bg-[#0052a3]">
                        <Download className="mr-2 h-4 w-4" /> Xuất file Mẫu 09
                      </Button>
                    </div>
                  )}

                  {selectedTemplate === '04_Mau_Thong_bao' && ("""
page_content = page_content.replace(ui_search, ui_replace)

with open('webapp/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_content)

print("Patch applied for Mau 09")
