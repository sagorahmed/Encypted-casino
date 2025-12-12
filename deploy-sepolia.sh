#!/bin/bash

# Encrypted Casino - Sepolia Deployment Script
# This script deploys the updated GameHouse contract with leaderboard and statistics features

set -e

echo "=========================================="
echo "🚀 Encrypted Casino - Sepolia Deployment"
echo "=========================================="
echo ""

# Check environment variables
if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: SEPOLIA_RPC_URL not set"
    echo "Please set SEPOLIA_RPC_URL environment variable"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set"
    echo "Please set PRIVATE_KEY environment variable"
    exit 1
fi

# Navigate to contracts directory
cd contracts

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps || true

echo ""
echo "🔨 Compiling contracts..."
npx hardhat compile

echo ""
echo "🚀 Deploying to Sepolia testnet..."
echo "Network: Sepolia (Chain ID: 11155111)"
echo ""

# Deploy contract
npx hardhat run scripts/deploySepolia.ts --network sepolia

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Copy the deployed contract address above"
echo "2. Update frontend/.env.sepolia with the new address:"
echo "   NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=0x<ADDRESS>"
echo "3. Run: cd frontend && npm run dev"
echo "4. Test the application at http://localhost:3000"
echo ""
