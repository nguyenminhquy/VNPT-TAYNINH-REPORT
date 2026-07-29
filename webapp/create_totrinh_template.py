import sys
import os
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE

def create_template():
    doc = Document()
    
    # Custom styles
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(14)
    
    # Header: Quoc Hieu - Tieu Ngu & Ten co quan
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    cell_left = table.cell(0, 0)
    p_left = cell_left.paragraphs[0]
    p_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_left1 = p_left.add_run('TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM\n')
    r_left1.font.size = Pt(12)
    r_left2 = p_left.add_run('VNPT TÂY NINH')
    r_left2.bold = True
    r_left2.font.size = Pt(13)
    p_left_2 = cell_left.add_paragraph()
    p_left_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_left_2.add_run('Số: {{SO_TO_TRINH}}').font.size = Pt(13)
    
    cell_right = table.cell(0, 1)
    p_right = cell_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_right1 = p_right.add_run('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n')
    r_right1.bold = True
    r_right1.font.size = Pt(13)
    r_right2 = p_right.add_run('Độc lập - Tự do - Hạnh phúc')
    r_right2.bold = True
    r_right2.font.size = Pt(14)
    r_right2.underline = True
    
    p_right_2 = cell_right.add_paragraph()
    p_right_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_right_2.add_run('{{NGAY_THANG}}').font.size = Pt(13)
    p_right_2.style.font.italic = True
    
    doc.add_paragraph() # spacing
    
    # Title
    p_title1 = doc.add_paragraph()
    p_title1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t1 = p_title1.add_run('TỜ TRÌNH')
    r_t1.bold = True
    r_t1.font.size = Pt(16)
    
    p_title2 = doc.add_paragraph()
    p_title2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t2 = p_title2.add_run('V/v: {{TIEU_DE}}')
    r_t2.bold = True
    r_t2.font.size = Pt(14)
    
    doc.add_paragraph() # spacing
    
    # Kinh gui
    p_kinhgui = doc.add_paragraph()
    p_kinhgui.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_kg1 = p_kinhgui.add_run('Kính gửi: ')
    r_kg1.bold = True
    r_kg1.font.size = Pt(14)
    r_kg2 = p_kinhgui.add_run('{{KINH_GUI}}')
    r_kg2.bold = True
    r_kg2.font.size = Pt(14)
    
    doc.add_paragraph() # spacing
    
    # Can cu
    doc.add_paragraph('{{CAN_CU}}')
    
    # Noi dung
    doc.add_paragraph('{{NOI_DUNG}}')
    
    # De xuat
    doc.add_paragraph('{{DE_XUAT}}')
    
    doc.add_paragraph() # spacing
    
    # Footer: Nhan & Ky
    table_footer = doc.add_table(rows=1, cols=2)
    
    cell_f_left = table_footer.cell(0, 0)
    p_fl1 = cell_f_left.paragraphs[0]
    r_fl1 = p_fl1.add_run('Nơi nhận:\n')
    r_fl1.bold = True
    r_fl1.font.size = Pt(12)
    p_fl1.add_run('{{NOI_NHAN}}').font.size = Pt(11)
    
    cell_f_right = table_footer.cell(0, 1)
    p_fr1 = cell_f_right.paragraphs[0]
    p_fr1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_fr1 = p_fr1.add_run('NGƯỜI PHÊ DUYỆT\n\n\n\n')
    r_fr1.bold = True
    p_fr1.add_run('{{NGUOI_KY}}').bold = True

    # Nguoi lap section
    p_lap = cell_f_left.add_paragraph()
    p_lap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lap.add_run('\n\nNGƯỜI LẬP\n\n\n\n').bold = True
    p_lap.add_run('{{NGUOI_LAP}}').bold = True

    os.makedirs('templates', exist_ok=True)
    out_path = os.path.join('templates', 'ToTrinh_Template.docx')
    doc.save(out_path)
    print(f"Created template at {out_path}")

if __name__ == '__main__':
    create_template()
