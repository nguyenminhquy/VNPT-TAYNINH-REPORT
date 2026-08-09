import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')
data_dir = 'data sample/DATA SAMPLE THANG'

def check_anchor(filename, sheetname, anchor):
    try:
        wb = openpyxl.load_workbook(f'{data_dir}/{filename}', data_only=True)
        sheet = wb[sheetname]
        found = False
        for row in sheet.iter_rows(values_only=True):
            for cell in row:
                if isinstance(cell, str) and (anchor in cell or anchor.replace('â','a') in cell.replace('â','a')):
                    found = True
                    print(f"OK: {filename} -> {sheetname} -> '{anchor}' found")
                    return
        print(f"FAIL: {filename} -> {sheetname} -> '{anchor}' NOT found")
    except Exception as e:
        print(f"ERR: {filename} -> {sheetname} -> {e}")

check_anchor('1. BÁO CÁO MBB_HUNG.xlsx', 'Kết quả chung', 'Toàn quốc')
check_anchor('1. BÁO CÁO MBB_HUNG.xlsx', 'So sánh các tỉnh', 'Tây Ninh')
check_anchor('1. BÁO CÁO MBB_HUNG.xlsx', 'Kết quả chi tiết', 'MBB QoS')

check_anchor('2. BÁO CÁO FBB_BAO.xlsx', 'Thông tin chung', 'FBB QoS')
check_anchor('2. BÁO CÁO FBB_BAO.xlsx', 'Thông tin chung', 'FBB QoE')

check_anchor('3. BÁO CÁO MYTV_TÂN.xlsx', 'Sheet1', 'MyTV QoS')
check_anchor('3. BÁO CÁO MYTV_TÂN.xlsx', 'Sheet1', 'Tây Ninh')

check_anchor('5. BÁO CÁO ISPEED_QUOC.xlsx', 'Báo cáo', 'Tân Ninh')

check_anchor('6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx', 'Sheet1', 'Tân Ninh')
check_anchor('6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx', 'Sheet1', 'Bến Lức')
check_anchor('6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx', 'Sheet1', 'Đức Hòa')
check_anchor('6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx', 'Sheet1', 'Tân Châu')
