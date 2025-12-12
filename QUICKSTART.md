# Encrypted Casino - Quick Start Cheatsheet

## 🚀 Installation (5 minutes)

```bash
# Navigate to project
cd "d:\Blockchain project\Encrypted casino"

# Windows: Run installer
install.bat

# Or manual install
npm install
npm install --workspace=contracts
npm install --workspace=frontend
```

## ⚙️ Configuration (5 minutes)

### Create `contracts/.env`
```env
HARDHAT_NETWORK=hardhat
FHEVM_TESTNET_RPC_URL=http://localhost:8545
PRIVATE_KEY=your_key_here
```

### Create `frontend/.env.local`
```env
NEXT_PUBLIC_GAMEHOUSE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=9000
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id
NEXT_PUBLIC_OWNER_ADDRESS=0x...
```

## 🎮 Running (3 terminals)

### Terminal 1: Start Local Node
```bash
npm run node --workspace=contracts
```

### Terminal 2: Deploy Contract
```bash
npm run deploy --workspace=contracts
# Copy contract address to frontend .env.local
```

### Terminal 3: Start Frontend
```bash
npm run dev --workspace=frontend
# Open http://localhost:3000
```

## 🎯 Core Files to Know

| File | Purpose | Lines |
|------|---------|-------|
| `contracts/GameHouse.sol` | Main contract | ~850 |
| `frontend/src/pages/index.tsx` | Player dashboard | ~80 |
| `frontend/src/components/Dashboard.tsx` | Game selection | ~250 |
| `frontend/src/lib/fhevm-client.ts` | FHE encryption | ~100 |
| `frontend/src/components/Games/CoinFlip.tsx` | Coin flip game | ~180 |
| `frontend/src/components/Games/RangePredictor.tsx` | Range game | ~220 |

## 📊 Key Smart Contract Functions

```solidity
// User Functions
deposit()                           // Deposit ETH
withdraw(uint256 amount)            // Withdraw ETH
playCoinFlip(enc, proof, bet)       // Play coin flip
playRangePredictor(enc, proof, bet) // Play range game

// Owner Functions
depositHouseFunds()                 // Add house funds
withdrawHouseFunds(uint256 amount)  // Withdraw funds
getHouseFunds()                     // View house balance

// View Functions
getEncryptedBalance(address)        // Get encrypted balance
getContractBalance()                // Get total contract balance
getGameHistoryLength()              // Games played count
getGameResult(uint256 index)        // Get game details
```

## 🎮 Game Rules

### Coin Flip
```
Choice:      0 = Heads, 1 = Tails
Max Bet:     0.0001 ETH
Win Chance:  50%
Win Payout:  Bet × 2
```

### Range Predictor
```
Range:       1-100
Midpoint:    50
Choice:      0 = Below 50, 1 = Above 50
Max Bet:     0.0001 ETH
Win Chance:  50% (approx)
Win Payout:  Bet × 2
```

## 🔑 Key Technologies

| Tech | Version | Purpose |
|------|---------|---------|
| Solidity | 0.8.19 | Smart contracts |
| FHEVM | 0.3.1 | FHE encryption |
| Hardhat | 2.19 | Contract dev |
| Next.js | 14.0 | Frontend |
| React | 18.2 | UI library |
| Wagmi | 2.0 | Wallet mgmt |
| Tailwind | 3.3 | Styling |
| fhevmjs | 0.3 | FHE client |

## 📍 Important URLs & Addresses

```
Frontend:    http://localhost:3000
RPC:         http://localhost:8545
Chain ID:    9000 (FHEVM testnet)
Gas Limit:   30,000,000 (local)

After deployment:
GameHouse:   0x[contract address] ← Update in .env.local
```

## ✅ Test Checklist

- [ ] Smart contract compiles
- [ ] Contract deploys successfully
- [ ] Frontend starts without errors
- [ ] Wallet connects
- [ ] Can deposit ETH
- [ ] Can play Coin Flip
- [ ] Can play Range Predictor
- [ ] Can withdraw ETH
- [ ] Owner dashboard loads
- [ ] Recent game history shows

## 🐛 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Cannot find module 'react'" | `npm install --workspace=frontend` |
| "Contract not deployed" | Deploy with `npm run deploy` |
| "Contract address 0x0..." | Update NEXT_PUBLIC_GAMEHOUSE_ADDRESS |
| "Wallet not connected" | Click "Connect" button, approve in MetaMask |
| "Port 3000 in use" | Kill: `lsof -ti :3000 \| xargs kill -9` |
| "Port 8545 in use" | Kill node process or use different port |

## 🔐 Security Reminders

⚠️ **NEVER commit .env files!**
```bash
# Already in .gitignore:
.env
.env.local
.env.*.local
```

⚠️ **Private keys are sensitive!**
- Use separate account for testing
- Never use real money keys
- Use testnet accounts only

## 📈 Gas Usage

| Operation | Gas | Time |
|-----------|-----|------|
| Deposit | ~300k | 5-10s |
| Withdrawal | ~400k | 10-15s |
| CoinFlip | 3-4M | 15-30s |
| RangePredictor | 3-4M | 15-30s |

## 🎨 Tailwind Colors

```css
/* Custom casino theme */
casino-dark:   #0f172a   /* Dark background */
casino-purple: #7c3aed   /* Primary color */
casino-gold:   #d97706   /* Accent color */
```

## 📝 Important Files to Edit

```
1. contracts/.env          ← Add private key
2. frontend/.env.local     ← Add contract address
3. contracts/GameHouse.sol ← Modify game logic
4. frontend/src/...        ← Update UI
```

## 🚀 Deployment Checklist

### Before Local Testing
- [ ] `npm install` completed
- [ ] .env files created
- [ ] Hardhat config checked
- [ ] No TypeScript errors

### Before Testnet
- [ ] Contract code reviewed
- [ ] Tests pass (`npm run test`)
- [ ] Gas estimates checked
- [ ] Testnet RPC configured

### Before Mainnet (Future)
- [ ] Third-party audit completed
- [ ] All tests passing
- [ ] Security review done
- [ ] Insurance/coverage verified

## 📞 Quick Help

```bash
# Check Node version
node -v  # Should be 18+

# Check npm version
npm -v   # Should be 9+

# Clear cache
npm cache clean --force

# Reinstall everything
rm -rf node_modules
npm install
npm install --workspace=contracts
npm install --workspace=frontend

# Check contract syntax
npx hardhat compile

# See contract ABI
cat contracts/artifacts/contracts/GameHouse.sol/GameHouse.json
```

## 🎯 Common Workflows

### Playing a Game
1. Connect wallet
2. Deposit funds
3. Select game
4. Choose option
5. Place bet
6. View result
7. Withdraw if desired

### Managing House (Owner)
1. Navigate to `/owner-dashboard`
2. Check encrypted balances
3. Deposit/withdraw house funds
4. View statistics

### Debugging
1. Check browser console (F12)
2. Check terminal output
3. Check contract events
4. Verify .env files
5. Check gas limits

## 📚 Documentation Map

| Document | Content |
|----------|---------|
| README.md | Overview & features |
| SETUP.md | Installation guide |
| ARCHITECTURE.md | Technical details |
| ROADMAP.md | Future features |
| PROJECT_SUMMARY.md | Quick reference |
| FILE_INVENTORY.md | All files created |
| DIAGRAMS.md | Visual flow charts |
| **THIS FILE** | Cheatsheet |

## 💡 Pro Tips

1. **Use hardhat node** for instant confirmation
2. **Check gas estimates** before deploying
3. **Keep private keys** in separate files
4. **Test on testnet** before mainnet
5. **Monitor events** for debugging
6. **Use console.log** in contracts
7. **Cache components** for performance
8. **Batch transactions** to save gas

## 🎓 Learning Resources

- [Zama FHEVM Docs](https://docs.zama.ai/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [Hardhat Docs](https://hardhat.org/)
- [Next.js Docs](https://nextjs.org/)
- [Wagmi Docs](https://wagmi.sh/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)

## 🤝 Contributing

```bash
# Fork → Clone → Branch → Commit → Push → PR

git checkout -b feature/my-feature
# Make changes
git commit -am "Add my feature"
git push origin feature/my-feature
# Create PR on GitHub
```

## ❓ FAQ

**Q: Why is the game slow?**
A: FHE operations are computationally expensive. This is normal!

**Q: Can I use real money?**
A: No, only on testnet. Use testnet ETH from faucets.

**Q: Where's my balance?**
A: It's encrypted on-chain. Decrypt with your private key.

**Q: How does FHE work?**
A: Math magic! All computations on encrypted data.

**Q: Can the owner cheat?**
A: No! Game logic is deterministic and encrypted.

**Q: What if I lose my key?**
A: You lose access to your balance (not recoverable).

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Ready for Testing ✅

🎰 **Ready to Play!** 🔒
