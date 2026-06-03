@echo off
setlocal
cd /d "%~dp0"

if not exist "scripts\make-rdp-package.ps1" (
  echo scripts\make-rdp-package.ps1 tidak ditemukan.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\make-rdp-package.ps1" %*
echo.
pause

