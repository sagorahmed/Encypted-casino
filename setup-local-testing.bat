@echo off
REM Encrypted Casino - Local Testing Startup Script
REM This script automates the setup for local Hardhat testing

echo.
echo ====================================
echo   Encrypted Casino - Local Testing
echo ====================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install it from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Check if we're in the right directory
if not exist "contracts" (
    echo ❌ Error: contracts folder not found
    echo Please run this script from the Encrypted Casino root directory
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
echo.

REM Install contract dependencies
cd contracts
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install contract dependencies
    pause
    exit /b 1
)
cd ..

REM Install frontend dependencies
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Dependencies installed successfully!
echo.
echo ====================================
echo   Next Steps:
echo ====================================
echo.
echo 1. Start Hardhat Node (Terminal 1):
echo    cd contracts
echo    npm run node
echo.
echo 2. Deploy Contract (Terminal 2):
echo    cd contracts
echo    npm run deploy:local
echo.
echo 3. Start Frontend (Terminal 3):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open browser: http://localhost:3000
echo.
echo 📖 For detailed guide, see: TESTING_GUIDE.md
echo.
pause
