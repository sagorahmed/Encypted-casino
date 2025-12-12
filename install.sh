#!/bin/bash

# Encrypted Casino - Quick Start Script

echo "🎰 Encrypted Casino - Installation Script"
echo "=========================================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi

# Install contracts dependencies
echo ""
echo "📦 Installing contract dependencies..."
npm install --workspace=contracts

if [ $? -ne 0 ]; then
    echo "❌ Failed to install contract dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install --workspace=frontend

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Create .env files in contracts/ and frontend/ directories"
echo "2. Set environment variables as described in README.md"
echo "3. Deploy contract: npm run deploy --workspace=contracts"
echo "4. Start frontend: npm run dev --workspace=frontend"
echo ""
echo "Happy gaming! 🎰"
