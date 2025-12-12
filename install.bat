@echo off
REM Encrypted Casino - Quick Start Script for Windows

echo.
echo 🎰 Encrypted Casino - Installation Script
echo ==========================================

REM Check Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Install root dependencies
echo.
echo 📦 Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM Install contracts dependencies
echo.
echo 📦 Installing contract dependencies...
call npm install --workspace=contracts
if %errorlevel% neq 0 (
    echo ❌ Failed to install contract dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
call npm install --workspace=frontend
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo Next steps:
echo 1. Create .env files in contracts/ and frontend/ directories
echo 2. Set environment variables as described in README.md
echo 3. Deploy contract: npm run deploy --workspace=contracts
echo 4. Start frontend: npm run dev --workspace=frontend
echo.
echo Happy gaming! 🎰
echo.
pause
