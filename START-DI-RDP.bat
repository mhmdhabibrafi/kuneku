@echo off
setlocal
cd /d "%~dp0"
title KUNEKU - RDP Starter

echo KUNEKU
echo.

if not exist "forms-gpt-agent\config.json" if exist "forms-gpt-agent\config.rdp.json" (
  echo Membuat config awal bersih untuk RDP...
  copy /y "forms-gpt-agent\config.rdp.json" "forms-gpt-agent\config.json" >nul
)

if exist "KUNEKU-ControlPanel.exe" (
  echo Membuka Control Panel...
  start "" "%CD%\KUNEKU-ControlPanel.exe"
  echo.
  echo Di Control Panel: Login OAuth jika perlu, lalu Start Dashboard dan Start Gateway.
  echo Dashboard: http://localhost:18888
  pause
  exit /b 0
)

echo Control Panel tidak ditemukan. Menjalankan dashboard langsung.
call "%~dp0start-forms-agent.bat"
