## 🎰 Encrypted Casino - Testing & Deployment Setup Complete!

Your app is now fully configured for both **local testing with Hardhat** and **deployment to Sepolia testnet**. Here's everything that was set up:

---

## 📋 What Was Added

### ✅ Configuration Files Created
```
.env.local              ← Local Hardhat testing config
.env.sepolia            ← Sepolia deployment config
```

### ✅ Deployment Scripts Created
```
contracts/scripts/deployLocal.ts    ← Deploy to local Hardhat
contracts/scripts/deploySepolia.ts  ← Deploy to Sepolia testnet
```

### ✅ Configuration Updated
```
contracts/hardhat.config.ts         ← Added Sepolia network config
contracts/package.json              ← Added deploy commands
frontend/src/lib/wallet-config.ts   ← Added Hardhat network support
```

### ✅ Documentation Created
```
TESTING_GUIDE.md           ← Complete testing & deployment guide
DEPLOYMENT_SETUP.md        ← Setup overview & quick commands
DEPLOYMENT_CHECKLIST.md    ← Step-by-step deployment checklist
METAMASK_SETUP.md          ← MetaMask configuration guide
setup-local-testing.bat    ← Automated setup script (Windows)
```

---

## 🚀 Quick Start - LOCAL TESTING (Hardhat)

### **Terminal 1: Start Hardhat Node**
```bash
cd contracts
npm run node
```
Runs local Ethereum node on `http://127.0.0.1:8545`

### **Terminal 2: Deploy Contract**
```bash
cd contracts
npm run deploy:local
```
Deploys GameHouse contract and outputs:
```
✅ GameHouse deployed to: 0x5FbDB2315678afccB33F69682145433259423435
NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=0x5FbDB2315678afccB33F69682145433259423435
NEXT_PUBLIC_OWNER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### **Terminal 3: Start Frontend**
```bash
cd frontend
npm run dev
```
Opens app at `http://localhost:3000`

### **Step 4: Connect MetaMask**
1. Install MetaMask: https://metamask.io
2. Add Hardhat network (Chain ID: 31337, RPC: http://127.0.0.1:8545)
3. Import test account with private key: 
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9c3fedd2b7b7b0f0000
   ```
4. Click "Connect Wallet" in app
5. **Play games!**

---

## 🌐 Quick Start - SEPOLIA DEPLOYMENT

### **Step 1: Get Sepolia ETH**
1. Go to: https://www.sepoliafaucet.com
2. Paste your wallet address
3. Receive 0.05 Sepolia ETH

### **Step 2: Get Infura RPC Key**
1. Sign up: https://infura.io
2. Create project → Select Ethereum → Sepolia
3. Copy Project ID/RPC URL

### **Step 3: Update Environment**
Create `.env.sepolia`:
```bash
PRIVATE_KEY=0x...your_wallet_private_key...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_OWNER_ADDRESS=0x...your_wallet_address...
```

### **Step 4: Deploy**
```bash
cd contracts
npm run deploy:sepolia
```

### **Step 5: Update Frontend & Test**
Update `.env.local`:
```bash
NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=0x...from_deployment...
NEXT_PUBLIC_OWNER_ADDRESS=0x...your_wallet...
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_NETWORK_ID=11155111
```

Start frontend & test:
```bash
cd frontend
npm run dev
```

---

## 📚 Documentation Guide

| Document | Purpose | Read When |
|----------|---------|-----------|
| **TESTING_GUIDE.md** | Complete testing walkthrough | Setting up for the first time |
| **METAMASK_SETUP.md** | MetaMask configuration | Having wallet issues |
| **DEPLOYMENT_CHECKLIST.md** | Step-by-step checklist | Deploying to Sepolia |
| **DEPLOYMENT_SETUP.md** | Quick reference guide | Need quick commands |

---

## 🎮 Testing Games

### **Coin Flip**
- Guess Heads or Tails
- Win 2x your bet if correct
- Instant result

### **Range Predictor**
- Guess if number is Above or Below 50
- Win 2x if correct
- Random number 1-100 generated

---

## 🔧 Network Summary

| Network | Chain ID | RPC URL | Balance | Status |
|---------|----------|---------|---------|--------|
| **Hardhat** | 31337 | http://127.0.0.1:8545 | Unlimited | ✅ Ready |
| **Sepolia** | 11155111 | https://sepolia.infura.io/v3/KEY | Test ETH | ✅ Ready |

---

## ✨ Key Features Enabled

✅ **Local Testing**
- Play games instantly (no gas fees)
- No blockchain transactions needed
- Perfect for development

✅ **Testnet Deployment**
- Real blockchain transactions
- View on Etherscan
- Test with actual smart contract logic

✅ **Easy Switching**
- Switch between Hardhat and Sepolia in MetaMask
- Different `.env` files for each network
- No code changes needed

---

## 📋 Files You'll Edit

When deploying, you'll update these:

```
.env.local          ← Add contract address + owner address + RPC URL
.env.sepolia        ← Add private key + RPC URL + owner address
```

**⚠️ Important:** Never commit `.env` files to Git!

---

## 🆘 Troubleshooting Quick Links

**Can't connect to Hardhat?**
→ See TESTING_GUIDE.md → Troubleshooting → "Cannot connect to network"

**MetaMask issues?**
→ See METAMASK_SETUP.md → Troubleshooting section

**Deployment failed?**
→ See DEPLOYMENT_CHECKLIST.md → Troubleshooting

**General questions?**
→ See TESTING_GUIDE.md → Full documentation

---

## 🎯 Next Steps

1. **Read TESTING_GUIDE.md** for detailed instructions
2. **Set up MetaMask** using METAMASK_SETUP.md
3. **Run local Hardhat** following Quick Start above
4. **Test games** in browser
5. **Deploy to Sepolia** using DEPLOYMENT_CHECKLIST.md
6. **Verify on Etherscan**: https://sepolia.etherscan.io

---

## 🔐 Security Reminders

⚠️ **DO:**
- Keep private keys secret
- Use test wallets for testing
- Start with small amounts
- Verify contract addresses

⚠️ **DON'T:**
- Commit `.env` files to Git
- Share private keys
- Paste keys in untrusted websites
- Leave large sums in test wallets

---

## 📞 Support Resources

- **Hardhat Docs:** https://hardhat.org/
- **Wagmi Docs:** https://wagmi.sh/
- **RainbowKit Docs:** https://www.rainbowkit.com/
- **Etherscan:** https://sepolia.etherscan.io

---

## 🎉 You're All Set!

Everything is configured and ready to go. Start with the Quick Start sections above!

**Questions?** Check the relevant documentation file listed above.

**Ready?** Let's test this! 🚀
