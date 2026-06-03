@echo off
setlocal
set "ROOT=%~dp0"
set "APP=%ROOT%forms-gpt-agent"

cd /d "%APP%"
echo KUNEKU - Dashboard
echo.

if not exist "config.json" if exist "config.rdp.json" (
  echo Membuat config awal bersih untuk mesin ini...
  copy /y "config.rdp.json" "config.json" >nul
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum tersedia di PATH.
  echo Install Node.js LTS di RDP, lalu jalankan file ini lagi.
  pause
  exit /b 1
)

if not exist "node_modules" (
  where npm >nul 2>nul
  if errorlevel 1 (
    echo npm belum tersedia di PATH, sedangkan dependency belum ada.
    echo Install Node.js LTS lengkap dengan npm.
    pause
    exit /b 1
  )
  echo Dependency belum ada. Menjalankan npm ci...
  if exist "package-lock.json" (
    call npm ci
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo Install dependency gagal.
    pause
    exit /b 1
  )
)

if not exist "dist\index.html" (
  where npm >nul 2>nul
  if errorlevel 1 (
    echo Build dashboard belum ada dan npm tidak tersedia.
    pause
    exit /b 1
  )
  echo Build dashboard React...
  call npm run build
  if errorlevel 1 (
    echo Build React gagal.
    pause
    exit /b 1
  )
)

echo.
echo Dashboard akan terbuka di http://localhost:18888
echo Jangan tutup window ini selama sistem dipakai.
echo.
node server.js
pause
