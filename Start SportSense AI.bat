@echo off
title SportSense AI — Starting...
cd /d "%~dp0"

echo.
echo  ==========================================
echo   SportSense AI — AI Fitness Coach
echo  ==========================================
echo.

:: Check Node is installed
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check node_modules exists
if not exist "node_modules\" (
    echo  [INFO] Installing dependencies for the first time...
    echo  This may take a minute...
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo  [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo.
)

echo  [INFO] Starting development server...
echo  [INFO] The app will open at http://localhost:5173
echo.
echo  Press Ctrl+C in this window to stop the server.
echo.

:: Open browser after a short delay (runs in background)
start "" cmd /c "timeout /t 3 >nul && start http://localhost:5173"

:: Start Vite dev server
npm run dev

pause
