@echo off
:: BUKA FIREWALL UNTUK AKSES HP/PERANGKAT LAIN
:: Harus di-Run as Administrator (klik kanan -> Run as administrator)
title Buka Firewall Port 8000 - Angkringan Lor Dalan

echo ================================================================================
echo   BUKA FIREWALL WINDOWS UNTUK AKSES DARI HP / PERANGKAT LAIN
echo ================================================================================
echo   IP Laptop (Ethernet) : 192.168.10.254
echo   Port FastAPI          : 8000
echo   URL HP                : http://192.168.10.254:8000/login.html
echo   Syarat: HP harus konek WiFi yang sama (router 192.168.10.1)
echo ================================================================================
echo.

:: Cek admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Harus Run as Administrator!
    echo Klik kanan buka-firewall.bat -> Run as administrator
    pause
    exit /b 1
)

echo [1] Cek firewall status...
netsh advfirewall show currentprofile | findstr /i "State"

echo.
echo [2] Tambah inbound rule untuk port 8000 (TCP)...
netsh advfirewall firewall delete rule name="Angkringan FastAPI 8000" >nul 2>&1
netsh advfirewall firewall add rule name="Angkringan FastAPI 8000" dir=in action=allow protocol=TCP localport=8000 profile=private,public,domain
if %errorlevel% equ 0 (
    echo [OK] Rule inbound port 8000 berhasil ditambahkan
) else (
    echo [FAIL] Gagal tambah rule
)

echo.
echo [3] Cek rule...
netsh advfirewall firewall show rule name="Angkringan FastAPI 8000" | findstr /i "8000"

echo.
echo [4] Test bind 0.0.0.0 (biar HP bisa akses, jangan 127.0.0.1)...
echo Pastikan run.bat sudah pakai --host 0.0.0.0 (sudah diupdate)
findstr /i "0.0.0.0" run.bat >nul && echo [OK] run.bat sudah pakai 0.0.0.0 || echo [WARN] run.bat masih 127.0.0.1, update manual!

echo.
echo ================================================================================
echo   SELESAI! Sekarang:
echo   1. Jalankan run.bat atau VSCode Task: Run FastAPI (run.bat)
echo   2. Di HP (konek WiFi sama), buka: http://192.168.10.254:8000/login.html
echo   3. Login superadmin / Solojogja1
echo.
echo   Jika HP tidak bisa akses:
echo   - Cek HP konek WiFi dengan IP 192.168.10.x (bukan data seluler)
echo   - Cek Windows Firewall masih ON tapi rule sudah allow
echo   - Cek antivirus firewall (kadang block)
echo   - Coba ping dari HP: pakai app Ping Tools -> ping 192.168.10.254
echo ================================================================================
pause
