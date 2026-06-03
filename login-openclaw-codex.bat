@echo off
echo KUNEKU - Login OpenClaw Codex OAuth
echo.
where openclaw >nul 2>nul
if errorlevel 1 (
  echo OpenClaw belum terinstall atau belum ada di PATH.
  echo Install dulu OpenClaw, lalu jalankan file ini lagi.
  pause
  exit /b 1
)

echo Login OpenClaw ke OpenAI Codex OAuth.
echo Browser akan terbuka jika OpenClaw perlu login.
echo Jika callback tidak otomatis, paste full redirect URL dari localhost:1455.
echo.
echo PENTING:
echo Jika sudah muncul "OpenAI OAuth complete" dan "Default model set",
echo login sudah berhasil. Kalau window ini tidak kembali ke prompt, tutup saja.
echo Setelah itu buka KUNEKU Control Center lalu klik Start pada OpenClaw Gateway.
echo.
openclaw models auth login --provider openai-codex --set-default
if errorlevel 1 (
  echo.
  echo Login Codex OAuth gagal atau dibatalkan.
  pause
  exit /b 1
)

echo.
echo Login selesai.
echo Sekarang buka KUNEKU Control Center lalu klik Start pada OpenClaw Gateway.
pause
