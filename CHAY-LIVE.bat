@echo off
setlocal
cd /d "%~dp0live"
where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 24 LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if errorlevel 1 (
  echo Node.js 24 or newer is required. Update Node.js and retry.
  pause
  exit /b 1
)
if not exist "node_modules\.ganesha-v06-installed" (
  echo Installing Ganesha LIVE dependencies...
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation failed. Check your Internet connection and retry.
    pause
    exit /b 1
  )
  echo installed>"node_modules\.ganesha-v06-installed"
)
echo.
echo GANESHA LIVE v0.6 - Thai interactive scene
echo Keep this window open while streaming.
echo Open http://localhost:3000/live/control.html in your browser.
echo.
call npm start
pause
