@echo off
title Cloudflare Tunnel - warung.angkringanlordalan.my.id
color 0B
cd /d "%~dp0"
echo ================================================================================
echo   CLOUDFLARE TUNNEL - Angkringan Lor Dalan
echo   Domain : warung.angkringanlordalan.my.id
echo   Alias  : angkringanlordalan.my.id + www.angkringanlordalan.my.id
echo   Backend: http://127.0.0.1:8000  (FastAPI + SQLite)
echo   Tunnel : b0396a30-f9e9-42b0-ba59-25a8da1dc814 (angkringanlor)
echo ================================================================================
echo.

where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cloudflared belum terinstall - winget install --id Cloudflare.cloudflared
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('cloudflared --version 2^>^&1') do echo [OK] %%i

echo.
echo [CEK] Backend http://127.0.0.1:8000/api/health ...
powershell -Command "try { Invoke-WebRequest -Uri http://127.0.0.1:8000/api/health -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [WARN] Backend belum jalan! Jalankan run.bat dulu
    set /p LANJUT="Tetap jalankan tunnel? (y/N): "
    if /i not "%LANJUT%"=="y" exit /b 1
) else echo [OK] Backend aktif

echo.
echo [RUN] cloudflared tunnel run b0396a30-f9e9-42b0-ba59-25a8da1dc814
echo  Forward: warung.angkringanlordalan.my.id -^> 127.0.0.1:8000
echo  Tekan Ctrl+C untuk stop
echo ================================================================================
cloudflared tunnel run b0396a30-f9e9-42b0-ba59-25a8da1dc814
pause
