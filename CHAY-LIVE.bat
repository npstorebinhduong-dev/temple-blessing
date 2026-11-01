@echo off
setlocal
cd /d "%~dp0live"
where node >nul 2>&1
if errorlevel 1 (
  echo Please install Node.js 24 LTS from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\.temple-installed" (
  echo Installing dependencies. Internet connection required...
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation failed. Check your Internet connection and try again.
    pause
    exit /b 1
  )
  echo installed>"node_modules\.temple-installed"
)
echo Keep this window open while streaming.
echo Open http://localhost:3000/live/control.html in your browser.
call npm start
pause
