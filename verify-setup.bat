@echo off
REM SVR System - Verify Setup
REM This script checks if everything is installed correctly

echo.
echo ========================================
echo   SVR System - Setup Verification
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js installed
    echo      Version: 
    node --version
) else (
    echo [ERROR] Node.js not found
    echo         Install from https://nodejs.org/
)
echo.

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm installed
    echo      Version:
    npm --version
) else (
    echo [ERROR] npm not found
)
echo.

REM Check MySQL
echo Checking MySQL...
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL client installed
    echo      Version:
    mysql --version
) else (
    echo [WARNING] MySQL client not found
    echo           (installed version may still be available)
)
echo.

REM Check MySQL Server
echo Checking MySQL Server connectivity...
mysql -u root -p "" -e "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL Server running (default password)
) else (
    mysql -u root -e "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] MySQL Server running (no password)
    ) else (
        echo [WARNING] MySQL Server not responding
        echo           Make sure MySQL service is running
        echo           Try: net start MySQL80 (or your version)
    )
)
echo.

REM Check Backend dependencies
echo Checking Backend dependencies...
if exist "backend\node_modules" (
    echo [OK] Backend node_modules exists
) else (
    echo [MISSING] Backend node_modules not found
    echo            Run: cd backend ^& npm install
)
echo.

REM Check Frontend dependencies
echo Checking Frontend dependencies...
if exist "frontend\node_modules" (
    echo [OK] Frontend node_modules exists
) else (
    echo [MISSING] Frontend node_modules not found
    echo            Run: cd frontend ^& npm install
)
echo.

REM Check Backend .env
echo Checking Backend configuration...
if exist "backend\.env" (
    echo [OK] Backend .env exists
) else (
    echo [MISSING] Backend .env not found
    echo            Create from .env.example or use defaults
)
echo.

REM Check Frontend .env
echo Checking Frontend configuration...
if exist "frontend\.env" (
    echo [OK] Frontend .env exists
    echo      Contents:
    type frontend\.env
) else (
    echo [MISSING] Frontend .env not found
    echo            Run setup.bat to create it
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Next Steps:
echo  1. If anything is [MISSING], run: setup.bat
echo  2. To start servers, run: start-servers.bat
echo  3. Or manually:
echo     - Terminal 1: cd backend ^& npm run dev
echo     - Terminal 2: cd frontend ^& npm run dev
echo.

pause
