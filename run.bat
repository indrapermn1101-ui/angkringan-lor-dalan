@echo off
title Angkringan Lor Dalan - FastAPI + SQLite
color 0E
cd /d "%~dp0"
echo ================================================================================
echo   ANGKRINGAN LOR DALAN - FASTAPI + SQLITE
echo   Warung Makan Tradisional - Sambi Boyolali
echo ================================================================================
echo   Lokasi Project : %cd%
echo   Backend        : backend\main.py
echo   Database       : backend\angkringan.db (SQLite)
echo   Foto Menu      : static\images\ (16 JPG foto asli + 16 SVG)
echo   Superadmin     : superadmin / Solojogja1 (alias admin)
echo ================================================================================
echo.

REM Cek Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python tidak ditemukan! Install Python 3.11+ dulu.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [1/3] Install dependencies...
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Gagal install dependencies!
    pause
    exit /b 1
)

echo.
echo [2/3] Seed database (16 menu + superadmin)...
python -m backend.seed
if errorlevel 1 (
    echo [ERROR] Gagal seed database!
    pause
    exit /b 1
)

echo.
echo [3/3] Menjalankan FastAPI server (host 0.0.0.0 biar HP bisa akses)...
echo ----------------------------------------------------------------
echo   Frontend (Laptop) : http://127.0.0.1:8000/
echo   Frontend (HP)     : http://192.168.10.254:8000/login.html
echo   Swagger           : http://127.0.0.1:8000/docs  atau http://192.168.10.254:8000/docs
echo   API               : http://192.168.10.254:8000/api
echo   Health            : http://192.168.10.254:8000/api/health
echo   Login             : superadmin / Solojogja1
echo   Syarat HP         : Konek WiFi yang sama (192.168.10.x), firewall sudah allow via buka-firewall.bat
echo ----------------------------------------------------------------
echo   Tekan Ctrl+C untuk STOP server
echo   Jangan tutup window ini selama server jalan
echo ================================================================================
echo.

REM Jalankan server dengan reload, host 0.0.0.0 agar bisa diakses dari HP/perangkat lain di jaringan lokal
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

REM Jika server berhenti, tampilkan pesan
echo.
echo ================================================================================
echo   Server berhenti.
echo   Jika ingin jalankan lagi, double-click run.bat atau via VSCode Task
echo   VSCode: Ctrl+Shift+P > Tasks: Run Task > FastAPI: Run Server
echo ================================================================================
pause
