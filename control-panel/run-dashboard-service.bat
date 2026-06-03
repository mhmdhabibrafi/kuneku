@echo off
setlocal
set ROOT=%~dp0..
set APP=%ROOT%\forms-gpt-agent
set LOG_DIR=%ROOT%\logs
set LOG_FILE=%LOG_DIR%\dashboard.log

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
cd /d "%APP%"

echo.>> "%LOG_FILE%"
echo [%date% %time%] Starting KUNEKU dashboard...>> "%LOG_FILE%"

where node >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
  echo [%date% %time%] Node.js not found in PATH. Install Node.js LTS first.>> "%LOG_FILE%"
  exit /b 1
)

if not exist "config.json" if exist "config.rdp.json" (
  echo [%date% %time%] Creating clean first-run config from config.rdp.json...>> "%LOG_FILE%"
  copy /y "config.rdp.json" "config.json" >> "%LOG_FILE%" 2>&1
)

if not exist node_modules (
  where npm >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (
    echo [%date% %time%] npm not found in PATH and dependencies are missing.>> "%LOG_FILE%"
    exit /b 1
  )
  echo [%date% %time%] Installing dependencies...>> "%LOG_FILE%"
  if exist package-lock.json (
    call npm ci >> "%LOG_FILE%" 2>&1
  ) else (
    call npm install >> "%LOG_FILE%" 2>&1
  )
  if errorlevel 1 exit /b 1
)

if not exist dist\index.html (
  where npm >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (
    echo [%date% %time%] npm not found in PATH and dist build is missing.>> "%LOG_FILE%"
    exit /b 1
  )
  echo [%date% %time%] Building React dashboard...>> "%LOG_FILE%"
  call npm run build >> "%LOG_FILE%" 2>&1
  if errorlevel 1 exit /b 1
)

echo [%date% %time%] Running node server.js on http://localhost:18888>> "%LOG_FILE%"
node server.js >> "%LOG_FILE%" 2>&1
