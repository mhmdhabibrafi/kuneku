@echo off
setlocal
set ROOT=%~dp0..
set LOG_DIR=%ROOT%\logs
set LOG_FILE=%LOG_DIR%\openclaw-gateway.log

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
cd /d "%ROOT%"

echo.>> "%LOG_FILE%"
echo [%date% %time%] Starting OpenClaw gateway on http://localhost:18789>> "%LOG_FILE%"

where openclaw >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
  echo [%date% %time%] OpenClaw not found in PATH.>> "%LOG_FILE%"
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\enable-openclaw-openresponses.ps1" >> "%LOG_FILE%" 2>&1
openclaw gateway run --port 18789 --bind loopback --auth none --force --allow-unconfigured --verbose >> "%LOG_FILE%" 2>&1
