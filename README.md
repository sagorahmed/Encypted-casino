# Encrypted Casino

Encrypted Casino is a Web3 casino dApp (Solidity + Next.js) that’s built to support privacy-preserving gameplay using Zama’s Fully Homomorphic Encryption stack (FHEVM). The smart contract integrates Zama’s `@fhevm/solidity` primitives so game flows can be designed around encrypted values, while the frontend focuses on a clean, wallet-first UX (wagmi/viem).



## What’s Included

### Games
- Coin Flip (2x payout on win)
- Range Predictor (2x payout on win)
- Dice Roller (6x payout on win)

### UX behavior (current)
- Game result only shows after a **successful** transaction receipt (no “fake wins/losses” on reverted tx)
- Balance is **hidden by default**
- “Reveal Balance” requires the user to **sign a transaction** (`requestBalanceReveal()`), then the UI stores the revealed value locally
- Contract balance has a **manual refresh** button (no polling)
- “Your Statistics” refreshes **only after a successful game** (no polling)

## Repo Layout

- `contracts/` – Solidity contract + Hardhat tooling
- `frontend/` – Next.js frontend (wagmi/viem + RainbowKit)

## Prerequisites

- Node.js 18+
- npm
- MetaMask
- Sepolia ETH (for gas + bets)
- RPC URL (Infura/Alchemy/etc)
- WalletConnect Project ID (for RainbowKit)

## Quick Start (Sepolia)

### 1) Install

From the repo root:

```bash
npm install
npm install --workspace=contracts
npm install --workspace=frontend
```

Windows alternative:

```bat
install.bat
```

### 2) Configure environment

Create `contracts/.env`:

```env
# Sepolia deployer
# Sepolia deployment settings (fill before deploying)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
PRIVATE_KEY=your_private_key
NEXT_PUBLIC_NETWORK_ID=11155111
```

Create `frontend/.env`:
```env
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS= deployed contract address here
NEXT_PUBLIC_OWNER_ADDRESS= house owner address here
NEXT_PUBLIC_NETWORK_ID=11155111
```

Security note: never commit `.env*` files.

### 3) Compile contracts

```bash
npm run contracts:compile
```

### 4) Deploy to Sepolia

```bash
node scripts\deploy-ethers.js --workspace=contracts
```

Copy the Deployed GameHouse address into `frontend/.env` as `NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS`.

### 5) Run the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` on your browser.

## How to Use

### Player
1. Connect wallet (Sepolia)
2. Deposit
3. (Optional) Click **Reveal Balance** and confirm the transaction
4. Play games
5. Withdraw

If you revealed your balance, it updates after successful game/deposit/withdraw receipts.

### Owner
- Owner dashboard is at `/owner-dashboard`.
- Access is based on the contract’s `owner()`.

## Smart Contract Notes


### Explicit balance reveal
- Users must call `requestBalanceReveal()` (a signed tx) to reveal their current plaintext balance in an event.
- The frontend uses this as an explicit opt-in.

## Useful Commands

```bash
# Contracts
npm run compile --workspace=contracts
npm run test --workspace=contracts

# Frontend
npm run dev --workspace=frontend
npm run build --workspace=frontend
```


## 📝 Testing Checklist

- [ ] Deposit and withdraw funds
- [ ] Play Coin Flip game (win/lose scenarios)
- [ ] Play Range Predictor game (both above/below)
- [ ] Verify 2x payout calculation
- [ ] Check encrypted balance persistence
- [ ] Test owner dashboard access
- [ ] Test house fund management
- [ ] Verify maximum bet enforcement
- [ ] Test wallet connection/disconnection
- [ ] Verify game history tracking

## 🚨 Limitations & Future Improvements

### Future Features
- Encrypted leaderboard with FHE aggregation
- Multi-game sessions and progressive states
- Referral system with encrypted tracking
- Progressive jackpot with FHE accumulation
- Advanced analytics dashboard
- Mobile-responsive improvements

## 📚 Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/)
- [Zama Examples](https://github.com/zama-ai/fhevm-hardhat-template)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

This project is open-source and available under the MIT License.

## ⚠️ Disclaimer

This is a demonstration project. Before deploying to production:
- Conduct thorough security audits
- Test extensively on testnet
- Review smart contract logic
- Implement proper error handling
- Set up monitoring and alerting

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Built with FHEVM for privacy-first gaming** 🎰🔒
