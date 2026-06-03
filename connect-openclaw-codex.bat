@echo off
echo KUNEKU - Connect OpenClaw Codex OAuth
echo.
where openclaw >nul 2>nul
if errorlevel 1 (
  echo OpenClaw belum terinstall atau belum ada di PATH.
  echo Install dulu OpenClaw, lalu jalankan file ini lagi.
  pause
  exit /b 1
)

echo Step 1/2: Login OpenClaw ke OpenAI Codex OAuth.
echo Browser akan terbuka jika OpenClaw perlu login.
echo.
openclaw models auth login --provider openai-codex --set-default
if errorlevel 1 (
  echo.
  echo Login Codex OAuth gagal atau dibatalkan.
  pause
  exit /b 1
)

echo.
echo Step 2/2: Menjalankan OpenClaw Gateway di http://localhost:18789
echo Jangan tutup window ini selama KUNEKU dipakai.
echo Setelah gateway aktif, buka http://localhost:18888 lalu klik "Cek Koneksi AI".
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0enable-openclaw-openresponses.ps1"
openclaw gateway run --port 18789 --bind loopback --auth none --force --allow-unconfigured --verbose
pause
