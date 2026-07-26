@echo off
REM SVR Cashew Management System - Automatic Setup Script
REM This script sets up everything automatically

echo.
echo ========================================
echo   SVR System - Automatic Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

REM Check if MySQL is running
echo Checking MySQL connectivity...
mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL might not be running or credentials are incorrect
    echo Please ensure:
    echo   - MySQL server is running
    echo   - Username is 'root'
    echo   - .env file has correct DB credentials
    echo.
)

echo.
echo ========================================
echo BACKEND SETUP
echo ========================================
echo.

cd backend

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo Creating database tables...
call npm run setup-db
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database tables
    echo Make sure MySQL is running and .env credentials are correct
    pause
    exit /b 1
)
echo ✓ Database tables created
echo.

echo Seeding sample data...
call npm run seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database
    pause
    exit /b 1
)
echo ✓ Sample data seeded
echo.

cd ..

echo.
echo ========================================
echo FRONTEND SETUP
echo ========================================
echo.

cd frontend

echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

cd ..

echo.
echo ========================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Start Backend (in Terminal 1):
echo    cd backend
echo    npm run dev
echo.
echo 2. Start Frontend (in Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open http://localhost:5173 in your browser
echo.
echo 4. Login with:
echo    Username: admin
echo    Password: admin@123
echo.
echo 5. Read COMPLETE_SETUP_GUIDE.md for detailed information
echo.
echo Happy coding! 🚀
echo.

pause
