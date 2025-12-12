# MetaMask Setup Guide

## For Local Hardhat Testing

### Step 1: Install MetaMask
1. Go to: https://metamask.io/
2. Click "Download"
3. Choose your browser (Chrome, Firefox, Edge, etc.)
4. Add extension to your browser
5. Create account or import existing wallet

### Step 2: Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click the network dropdown (top left):
   ```
   [Network dropdown] ▼
   ```
3. Click "Add Network"
4. Click "Add a network manually" at the bottom
5. Enter these settings:

   | Field | Value |
   |-------|-------|
   | Network name | `Hardhat` |
   | New RPC URL | `http://127.0.0.1:8545` |
   | Chain ID | `31337` |
   | Currency symbol | `ETH` |
   | Block explorer URL | (leave blank) |

6. Click "Save"

### Step 3: Add Test Account to MetaMask

**Option A: Import Test Account**

1. In MetaMask, click your profile icon (top right)
2. Click "Import Account"
3. Paste this private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9c3fedd2b7b7b0f0000
   ```
4. Click "Import"
5. Account should appear with name "Account 2" (or similar)
6. **Note:** This account has unlimited test ETH on Hardhat!

**Option B: Use Different Test Accounts**

Hardhat creates 10 test accounts. Here are some of them:

```
Account 1: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9c3fedd2b7b7b0f0000

Account 2: 0x70997970C51812e339D9B73b0245ad59ca26e35
  Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account 3: 0x3C44CdDdB6a900c2127064064944fa7f24C3f148
  Private Key: 0x5de4111afa1a4b94908f83103db1fb1da93cb20170a088d1d91a627c99db4a1f
```

(See more in Hardhat documentation)

### Step 4: Verify Setup

1. Switch to "Hardhat" network
2. You should see your test account
3. Balance should show a large amount of ETH
4. You're ready to test!

---

## For Sepolia Network Testing

### Step 1: Ensure Sepolia Network is Added

MetaMask usually has Sepolia by default, but if not:

1. Click network dropdown
2. Click "Add Network"
3. Click "Add a network manually"
4. Enter:

   | Field | Value |
   |-------|-------|
   | Network name | `Sepolia` |
   | New RPC URL | `https://sepolia.infura.io/v3/YOUR_INFURA_KEY` |
   | Chain ID | `11155111` |
   | Currency symbol | `ETH` |
   | Block explorer URL | `https://sepolia.etherscan.io` |

5. Click "Save"

### Step 2: Get Sepolia ETH

1. Switch to Sepolia network in MetaMask
2. Go to one of these faucets:
   - https://www.sepoliafaucet.com (recommended)
   - https://faucet.quicknode.com/ethereum/sepolia
   - https://www.infura.io/faucet/sepolia

3. Copy your wallet address from MetaMask:
   - Click account dropdown
   - Click "Copy" next to account name
   - Or click account details and copy address

4. Paste address in faucet
5. Click "Send me ETH"
6. Wait for confirmation (1-5 minutes)
7. Check MetaMask balance

### Step 3: Verify Sepolia Setup

1. Switch to "Sepolia" network
2. You should see ETH balance
3. You're ready to deploy!

---

## Network Switcher

This is how to switch between networks:

1. Click the network dropdown (top left of MetaMask)
2. See list of your networks:
   ```
   Ethereum Mainnet
   Sepolia
   Hardhat          <- For local testing
   ...
   ```
3. Click the one you want
4. MetaMask switches immediately
5. You're now connected to that network

---

## Troubleshooting MetaMask

### "RPC URL error"
**Problem:** Can't connect to local node
**Solution:**
- Make sure Hardhat node is running: `npm run node`
- Check RPC URL is exactly: `http://127.0.0.1:8545`
- Try clearing cache: MetaMask Settings → Advanced → Clear Activity Tab Data

### "Wrong Chain ID"
**Problem:** MetaMask shows error about chain ID
**Solution:**
- Verify Chain ID is `31337` (Hardhat) or `11155111` (Sepolia)
- Delete network and re-add it carefully
- Make sure node is running with correct settings

### "Account has no ETH"
**Problem:** Hardhat account shows 0 ETH
**Solution (Hardhat):** 
- Restart Hardhat node: `npm run node`
- Re-import account
- Accounts should reset to have unlimited ETH

**Solution (Sepolia):**
- Go to faucet and request more ETH
- Check Etherscan to see if transaction went through

### "Pending transactions won't clear"
**Problem:** Old transaction stuck in pending
**Solution:**
- Click the pending transaction
- Click "Cancel"
- Increase gas price if prompted
- Wait for new transaction to confirm

### "Can't connect to app"
**Problem:** App asks to connect wallet but nothing happens
**Solution:**
- Refresh the page
- Disconnect and reconnect wallet
- Check you're on correct network (Hardhat or Sepolia)
- Check browser console for errors

---

## Best Practices

✅ **Do:**
- Keep test accounts private
- Use separate wallets for dev/test/prod
- Start with small test amounts
- Keep MetaMask updated
- Use strong password for MetaMask

❌ **Don't:**
- Share your private key
- Paste private key in untrusted websites
- Use same password as other accounts
- Leave large amounts in test wallets
- Use test accounts for real transactions

---

## Quick Reference

| Task | Steps |
|------|-------|
| Switch networks | Click network dropdown → Select network |
| Add account | Profile icon → Import Account → paste private key |
| Copy address | Click account dropdown → click address to copy |
| View balance | Look at number next to account name |
| Send ETH | Click Send → enter address & amount → confirm |
| Import wallet | Click profile → click "Import Account" → paste seed phrase |
| Export private key | Account Details → Show Private Key (keep secret!) |

---

## Need Help?

- MetaMask Help: https://metamask.io/support
- Hardhat Docs: https://hardhat.org/docs
- Sepolia Faucet: https://www.sepoliafaucet.com
- Etherscan (verify txs): https://sepolia.etherscan.io

---

Now you're ready to test! Start with the local Hardhat setup, then move to Sepolia.
