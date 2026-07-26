@echo off
REM SVR System - Start Both Servers
REM This script starts the backend and frontend dev servers

echo.
echo ========================================
echo   SVR System - Starting Servers
echo ========================================
echo.
echo This will open 2 terminal windows:
echo  - Terminal 1: Backend server (port 5000)
echo  - Terminal 2: Frontend server (port 5173)
echo.
echo Press any key to continue...
echo.
pause

echo Starting Backend Server...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Servers starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo When frontend opens in browser, login with:
echo   Username: admin
echo   Password: admin@123
echo.
echo Close either terminal to stop that server.
echo.
