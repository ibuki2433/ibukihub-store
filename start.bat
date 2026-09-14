@echo off
cd /d "%~dp0"
title IbukiHub - Software Store

echo =======================================================
echo    IbukiHub - Official Software Store
echo =======================================================
echo.
echo [1/3] Clearing port 5000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/3] Checking dependencies and build...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

if not exist client\dist (
    echo Building frontend...
    call npm run build
)

echo.
echo [3/3] Starting IbukiHub server...
echo The browser will open automatically at http://localhost:5000
echo.

node server/index.js
pause
