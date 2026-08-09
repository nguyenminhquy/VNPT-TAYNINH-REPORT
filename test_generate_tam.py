import sys
sys.path.insert(0, 'backend')
import generate_monthly_report
sources = generate_monthly_report.get_sources()
generate_monthly_report.update_tam_nhi(generate_monthly_report.Document('data sample/DATA SAMPLE THANG/BÁO CÁO THÁNG 7_ ĐỊNH HƯỚNG THÁNG 8.docx'), sources)
