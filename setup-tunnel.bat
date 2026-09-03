@echo off
title Setup Cloudflare Tunnel - angkringanloralan.my.id (Sekali saja)
color 0E
cd /d "%~dp0"
echo ================================================================================
echo   SETUP CLOUDFLARE TUNNEL - Sekali saja (butuh browser login)
echo   Domain: angkringanloralan.my.id
echo ================================================================================
echo.

where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cloudflared belum terinstall!
    echo  winget install --id Cloudflare.cloudflared
    echo  atau download https://github.com/cloudflare/cloudflared/releases
    pause
    exit /b 1
)

echo [1/4] Login Cloudflare (akan buka browser)...
cloudflared tunnel login
if %errorlevel% neq 0 (
    echo [ERROR] Login gagal
    pause
    exit /b 1
)

echo.
echo [2/4] Buat tunnel angkringan-lor-dalan...
cloudflared tunnel create angkringan-lor-dalan
if %errorlevel% neq 0 echo [WARN] Mungkin tunnel sudah ada, lanjut...

echo.
echo [3/4] Route DNS angkringanloralan.my.id -^> tunnel
cloudflared tunnel route dns angkringan-lor-dalan angkringanloralan.my.id
cloudflared tunnel route dns angkringan-lor-dalan www.angkringanloralan.my.id

echo.
echo [4/4] Buat config.yml
if not exist "%USERPROFILE%\.cloudflared" mkdir "%USERPROFILE%\.cloudflared"
set CONFIG=%USERPROFILE%\.cloudflared\config.yml
REM Ambil Tunnel ID dari list
for /f "tokens=1" %%i in ('cloudflared tunnel list ^| findstr angkringan-lor-dalan') do set TUNNEL_ID=%%i
echo Tunnel ID: %TUNNEL_ID%

echo tunnel: angkringan-lor-dalan > "%CONFIG%"
echo credentials-file: %USERPROFILE%\.cloudflared\%TUNNEL_ID%.json >> "%CONFIG%"
echo ingress: >> "%CONFIG%"
echo   - hostname: angkringanloralan.my.id >> "%CONFIG%"
echo     service: http://127.0.0.1:8000 >> "%CONFIG%"
echo   - hostname: www.angkringanloralan.my.id >> "%CONFIG%"
echo     service: http://127.0.0.1:8000 >> "%CONFIG%"
echo   - service: http_status:404 >> "%CONFIG%"

echo.
echo --- %CONFIG% ---
type "%CONFIG%"
echo.
echo [OK] Setup selesai! Sekarang jalankan: jalankan-tunnel.bat
echo  Pastikan backend jalan: run.bat
pause
