"""
Script kiểm tra nhanh xem tất cả import hoạt động và generate_report.py hợp lệ.
"""
import sys
print(f"Python: {sys.version}")

try:
    import openpyxl
    print(f"✅ openpyxl: {openpyxl.__version__}")
except ImportError as e:
    print(f"❌ openpyxl: {e}")

try:
    import zipfile, xml.etree.ElementTree
    print("✅ zipfile, xml.etree.ElementTree: built-in OK")
except ImportError as e:
    print(f"❌ {e}")

# Test import generate_report
try:
    sys.path.insert(0, r'c:\Users\quyng\Documents\TOOL TỔNG HỢP BÁO CÁO\VNPT REPORT\webapp')
    import generate_report
    print("✅ generate_report.py: import OK")
except Exception as e:
    print(f"❌ generate_report.py: {e}")

print("\nTất cả kiểm tra hoàn tất!")
