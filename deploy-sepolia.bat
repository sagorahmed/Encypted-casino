@echo off
REM Encrypted Casino - Sepolia Deployment Script (Windows)
REM This script deploys the updated GameHouse contract to Sepolia testnet

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo 🚀 Encrypted Casino - Sepolia Deployment
echo ==========================================
echo.

REM Check environment variables
if not defined SEPOLIA_RPC_URL (
    echo ❌ Error: SEPOLIA_RPC_URL not set
    echo Please set SEPOLIA_RPC_URL environment variable
    exit /b 1
)

if not defined PRIVATE_KEY (
    echo ❌ Error: PRIVATE_KEY not set
    echo Please set PRIVATE_KEY environment variable
    exit /b 1
)

REM Navigate to contracts directory
cd contracts

echo 📦 Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo 🔨 Compiling contracts...
call npx hardhat compile

echo.
echo 🚀 Deploying to Sepolia testnet...
echo Network: Sepolia ^(Chain ID: 11155111^)
echo.

REM Deploy contract
call npx hardhat run scripts/deploySepolia.ts --network sepolia

echo.
echo ==========================================
echo ✅ Deployment Complete!
echo ==========================================
echo.
echo 📋 Next Steps:
echo 1. Copy the deployed contract address above
echo 2. Update frontend\.env.sepolia with the new address:
echo    NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=0x^<ADDRESS^>
echo 3. Run: cd frontend ^&^& npm run dev
echo 4. Test the application at http://localhost:3000
echo.

pause
