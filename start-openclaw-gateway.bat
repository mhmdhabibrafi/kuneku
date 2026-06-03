@echo off
echo KUNEKU - Start OpenClaw Gateway
echo.
where openclaw >nul 2>nul
if errorlevel 1 (
  echo OpenClaw belum terinstall atau belum ada di PATH.
  pause
  exit /b 1
)

echo Menjalankan OpenClaw Gateway di http://localhost:18789
echo Jangan tutup window ini selama KUNEKU dipakai.
echo Setelah muncul gateway aktif, buka http://localhost:18888 lalu klik "Cek Koneksi AI".
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0enable-openclaw-openresponses.ps1"
openclaw gateway run --port 18789 --bind loopback --auth none --force --allow-unconfigured --verbose
pause
