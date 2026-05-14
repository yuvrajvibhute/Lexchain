@echo off
title LexChain - Demo Startup
color 0A
echo.
echo  ██╗     ███████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
echo  ██║     ██╔════╝╚██╗██╔╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║
echo  ██║     █████╗   ╚███╔╝ ██║     ███████║███████║██║██╔██╗ ██║
echo  ██║     ██╔══╝   ██╔██╗ ██║     ██╔══██║██╔══██║██║██║╚██╗██║
echo  ███████╗███████╗██╔╝ ██╗╚██████╗██║  ██║██║  ██║██║██║ ╚████║
echo  ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
echo.
echo  ======================================================
echo  Starting LexChain for LIVE DEMO...
echo  ======================================================
echo.

REM Kill any existing processes on ports 3001/5173
echo  Clearing old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " 2^>nul') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 /nobreak > nul

echo  [1/2] Starting Backend Server on http://localhost:3001
start "LexChain Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 6 /nobreak > nul

echo  [2/2] Starting Frontend on http://localhost:5173
start "LexChain Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 /nobreak > nul

echo.
echo  ======================================================
echo  ✅ LexChain is ready!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3001
echo.
echo  DEMO CREDENTIALS:
echo   Admin Passcode : NYAYA2024
echo   Judge Passcode : JUDGE2024
echo.
echo  HOW TO LOGIN:
echo   1. Open http://localhost:5173
echo   2. Click Register - Connect Wallet via Privy
echo   3. Select Role: Citizen / Lawyer / Judge / Admin
echo   4. Fill in details + password then register
echo   5. Login with same wallet + password
echo.
echo  ======================================================
echo  Press any key to open the app in your browser...
pause > nul
start http://localhost:5173
