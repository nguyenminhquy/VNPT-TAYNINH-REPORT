@echo off
chcp 65001 >nul
echo ============================================
echo  CAP NHAT BAO CAO XLSC - TAY NINH
echo ============================================
echo.
echo Dang tim kiem cac file du lieu...
echo.

python "%~dp0update_core.py"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  CAP NHAT THANH CONG!
    echo  File: BaoCao_XLSC_TayNinh_Updated.xlsx
    echo ============================================
    start "" "%~dp0BaoCao_XLSC_TayNinh_Updated.xlsx"
) else (
    echo.
    echo ============================================
    echo  LOI! Vui long kiem tra lai cac file nguon.
    echo ============================================
)
pause
