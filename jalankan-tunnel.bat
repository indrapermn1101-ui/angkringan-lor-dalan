@echo off
title Cloudflare Tunnel - angkringanloralan.my.id
color 0B
cd /d "%~dp0"
echo ================================================================================
echo   CLOUDFLARE TUNNEL - Angkringan Lor Dalan
echo   Domain : angkringanloralan.my.id
echo   Backend: http://127.0.0.1:8000  (FastAPI + SQLite)
echo   Project: %cd%
echo ================================================================================
echo.

REM === 1. Cek cloudflared terinstall ===
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cloudflared tidak ditemukan di PATH!
    echo.
    echo  Download dulu:
    echo   https://github.com/cloudflare/cloudflared/releases
    echo   pilih: cloudflared-windows-amd64.exe - rename jadi cloudflared.exe
    echo   taruh di C:\Windows\System32\ atau folder ini, lalu tambah ke PATH
    echo.
    echo  Atau install via winget:
    echo   winget install --id Cloudflare.cloudflared
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('cloudflared --version 2^>^&1') do echo [OK] %%i

REM === 2. Cek backend jalan di port 8000 ===
echo.
echo [CEK] Backend http://127.0.0.1:8000/api/health ...
powershell -Command "try { Invoke-WebRequest -Uri http://127.0.0.1:8000/api/health -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [WARN] Backend belum jalan di port 8000!
    echo  Jalankan dulu di window lain: double-click run.bat
    echo  atau: py -3.11 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
    echo.
    set /p LANJUT="Tetap jalankan tunnel? (y/N): "
    if /i not "%LANJUT%"=="y" exit /b 1
) else (
    echo [OK] Backend aktif
)

REM === 3. Cek config tunnel ===
set CONFIG=%USERPROFILE%\.cloudflared\config.yml
set TUNNEL_NAME=angkringan-lor-dalan
echo.
echo [CEK] Config: %CONFIG%
if not exist "%CONFIG%" (
    echo [WARN] config.yml belum ada - akan buat template
    if not exist "%USERPROFILE%\.cloudflared" mkdir "%USERPROFILE%\.cloudflared"
    echo # Cloudflare Tunnel config - Angkringan Lor Dalan > "%CONFIG%"
    echo tunnel: %TUNNEL_NAME% >> "%CONFIG%"
    echo credentials-file: %USERPROFILE%\.cloudflared\%TUNNEL_NAME%.json >> "%CONFIG%"
    echo ingress: >> "%CONFIG%"
    echo   - hostname: angkringanloralan.my.id >> "%CONFIG%"
    echo     service: http://127.0.0.1:8000 >> "%CONFIG%"
    echo   - hostname: www.angkringanloralan.my.id >> "%CONFIG%"
    echo     service: http://127.0.0.1:8000 >> "%CONFIG%"
    echo   - service: http_status:404 >> "%CONFIG%"
    echo [OK] Template config dibuat - EDIT tunnel ID jika perlu
    echo  Isi credentials-file harus sesuai Tunnel ID dari: cloudflared tunnel list
)

REM Tampilkan config
echo.
echo --- %CONFIG% ---
type "%CONFIG%"
echo -------------------
echo.
echo [INFO] Jika ini pertama kali, jalankan setup sekali (di CMD Admin):
echo   cloudflared tunnel login
echo   cloudflared tunnel create %TUNNEL_NAME%
echo   cloudflared tunnel route dns %TUNNEL_NAME% angkringanloralan.my.id
echo   cloudflared tunnel route dns %TUNNEL_NAME% www.angkringanloralan.my.id
echo.
echo [INFO] Tunnel akan forward: angkringanloralan.my.id -^> http://127.0.0.1:8000
echo  Tekan Ctrl+C untuk stop
echo ================================================================================
echo.

REM === 4. Jalankan tunnel ===
REM Opsi A: pakai config.yml (named tunnel) - RECOMMENDED untuk custom domain
echo [RUN] cloudflared tunnel run %TUNNEL_NAME%
cloudflared tunnel run %TUNNEL_NAME%

REM Jika named tunnel gagal (belum create), fallback ke quick tunnel
if %errorlevel% neq 0 (
    echo.
    echo [FALLBACK] Named tunnel gagal, coba quick tunnel...
    echo [RUN] cloudflared tunnel --url http://127.0.0.1:8000
    cloudflared tunnel --url http://127.0.0.1:8000
)

echo.
echo Tunnel berhenti. Tekan tombol untuk keluar
pause
