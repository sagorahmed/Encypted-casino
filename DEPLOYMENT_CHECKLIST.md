# Sepolia Deployment Checklist

Complete this checklist before deploying to Sepolia network.

## Prerequisites ✓

- [ ] MetaMask installed and set up
- [ ] Have a wallet address ready
- [ ] Node.js and npm installed (`npm --version`)
- [ ] All dependencies installed (`npm install` in both contracts and frontend)

## Get Sepolia ETH ✓

- [ ] Go to: https://www.sepoliafaucet.com
- [ ] Paste your wallet address
- [ ] Receive Sepolia ETH (usually 0.05 ETH)
- [ ] Verify balance in MetaMask (Sepolia network)

## Get RPC Endpoint ✓

- [ ] Sign up at: https://infura.io (or alchemy.com)
- [ ] Create new project
- [ ] Select Ethereum → Sepolia
- [ ] Copy Project ID / RPC URL
- [ ] Keep it secret (like a password!)

## Prepare Environment ✓

- [ ] Copy your wallet private key from MetaMask:
  - Account Menu → Account Details → Show Private Key
  - Format: `0x...` (64 hex characters after 0x)
  
- [ ] Create/update `.env` with:
  ```
  PRIVATE_KEY=0x...YOUR_PRIVATE_KEY...
  SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
  NEXT_PUBLIC_OWNER_ADDRESS=0x...YOUR_WALLET_ADDRESS...
  ```

- [ ] Verify `.env` is NOT in git:
  ```bash
  git status
  ```
  Should NOT show `.env`

## Deploy Smart Contract ✓

- [ ] Open terminal in `contracts` folder
- [ ] Run deployment:
  ```bash
  node scripts\deploy-ethers.js
  ```
  
- [ ] Wait for confirmation (~30-60 seconds)

- [ ] Copy contract address from output:
  ```
  ✅ GameHouse deployed to: 0x...
  ```

- [ ] Verify on Etherscan:
  ```
  https://sepolia.etherscan.io/address/0x...
  ```
  Should show: "Contract" with your code

## Configure Frontend ✓

- [ ] Update `.env`:
  ```
  NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS=0x...contract_from_above...
  NEXT_PUBLIC_OWNER_ADDRESS=0x...your_wallet...
  NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
  NEXT_PUBLIC_NETWORK_ID=11155111
  ```

- [ ] Verify it's not committed to git

## Test in Browser ✓

- [ ] Start frontend:
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] Open: http://localhost:3000

- [ ] In MetaMask:
  - [ ] Switch to Sepolia network
  - [ ] Make sure you have ETH balance
  
- [ ] In browser:
  - [ ] Click "Connect Wallet"
  - [ ] Select MetaMask
  - [ ] Approve connection
  - [ ] Wallet should show as connected

- [ ] Test Coin Flip:
  - [ ] Enter bet: 0.001 ETH
  - [ ] Select Heads or Tails
  - [ ] Click "Play"
  - [ ] Wait for transaction
  - [ ] See result

- [ ] Test Range Predictor:
  - [ ] Enter bet: 0.001 ETH
  - [ ] Select Above/Below 50
  - [ ] Click "Play"
  - [ ] Wait for transaction
  - [ ] See result

## Verify Transactions ✓

- [ ] Go to Etherscan:
  ```
  https://sepolia.etherscan.io
  ```

- [ ] Search for your wallet address

- [ ] Should see:
  - [ ] Contract deployment transaction
  - [ ] Game play transactions
  - [ ] All with "Success" status

## Success! 🎉

- [ ] Contract deployed to Sepolia
- [ ] Frontend connected to contract
- [ ] Games working on blockchain
- [ ] Transactions visible on Etherscan

---

## Troubleshooting

### "Cannot connect to Sepolia"
- [ ] Check RPC URL is correct in `.env`
- [ ] Verify Infura project ID is valid
- [ ] Make sure your account has Sepolia ETH

### "Contract deployment failed"
- [ ] Check gas price is reasonable
- [ ] Verify you have enough ETH for gas
- [ ] Check Infura project limits (free tier: 100k/day)

### "Connection rejected in MetaMask"
- [ ] Make sure Sepolia network is added to MetaMask
- [ ] Try disconnecting and reconnecting
- [ ] Refresh the page

### "Transaction reverted"
- [ ] Verify contract address is correct
- [ ] Check bet amount is valid (> 0)
- [ ] Make sure you have enough ETH for gas + bet

### "Cannot see transaction on Etherscan"
- [ ] Wait 1-2 minutes for block confirmation
- [ ] Verify you're searching on Sepolia etherscan
- [ ] Try searching by transaction hash instead

---

## Security Reminders ⚠️

- [ ] Never commit `.env` files
- [ ] Never share your private key
- [ ] Never paste private key in public places
- [ ] Use a fresh wallet for testing
- [ ] Start with small bet amounts
- [ ] Keep private key secure (consider hardware wallet for larger amounts)


Date Completed: _______________
Contract Address: _______________
Transaction Hash: _______________
