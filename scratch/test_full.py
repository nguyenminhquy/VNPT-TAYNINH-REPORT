import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'backend')
import generate_monthly_report
from pathlib import Path
generate_monthly_report.DATA_DIR = Path('data sample/DATA SAMPLE THANG')
sources = generate_monthly_report.load_sources()
doc = generate_monthly_report.Document('data sample/DATA SAMPLE THANG/BÁO CÁO THÁNG 7_ ĐỊNH HƯỚNG THÁNG 8.docx')
generate_monthly_report.update_mbb_fbb_mytv(doc, sources)
generate_monthly_report.update_ispeed(doc, sources)
generate_monthly_report.update_5s(doc, sources)
generate_monthly_report.update_tam_nhi(doc, sources)
print('Done!')
