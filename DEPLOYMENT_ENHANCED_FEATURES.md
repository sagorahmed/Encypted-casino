# 🚀 Enhanced Casino Features - Deployment & Feature Guide

## Overview

This guide covers the deployment of the enhanced Encrypted Casino with:
- ✅ **Leaderboards** - Track top players by profit and win rate
- ✅ **Player Statistics** - Individual game stats (wins, losses, profit)
- ✅ **Dice Roller Game** - New encrypted game with 6:1 payout
- ✅ **Improved Balance Tracking** - Accurate win/loss balance updates
- ✅ **On-Chain Game History** - Per-user game tracking

---

## 📋 New Features

### 1. Leaderboards 🏆
**Smart Contract Functions:**
```solidity
// Get top 10 players by profit
function getLeaderboard(uint256 count) external view returns (PlayerStats[] memory)

// Get top players by win rate
function getLeaderboardByWinRate(uint256 count) external view returns (address[], uint256[])

// Get total unique players
function getTotalPlayers() external view returns (uint256)
```

**Frontend Component:** `Leaderboard.tsx`
- Shows top 10 players by profit
- Displays win rate, games played, largest wins
- Real-time updates every 10 seconds
- Sortable by: Profit, Wins, Games Played

### 2. Player Statistics 📊
**Smart Contract Functions:**
```solidity
// Get a player's complete statistics
function getPlayerStats(address player) external view returns (PlayerStats memory)
```

**Frontend Component:** `PlayerStats.tsx`
- Individual player dashboard showing:
  - Total games played
  - Win/loss counts
  - Win rate percentage
  - Total profit/loss (color-coded)
  - Largest win and loss amounts
  - Average profit per game
  - Time of last game

### 3. Dice Roller Game 🎲
**Smart Contract Function:**
```solidity
function playDiceRoller(
    externalEuint32 encryptedChoice,
    bytes calldata choiceProof,
    uint256 betAmount
) external validBet(betAmount) nonReentrant returns (bool won)
```

**Game Details:**
- Pick a number from 1-6
- Win if your number matches the encrypted random result
- **Payout:** 6x your bet (if you win)
- **Chance:** 16.67% (1 in 6)
- **Strategy:** Higher risk, higher reward

**Frontend Component:** `DiceRoller.tsx`
- Visual dice number selector
- Real-time encrypted outcome
- Balance updates on win/loss

---

## 🔐 Data Structures

### PlayerStats Struct
```solidity
struct PlayerStats {
    address playerAddress;      // Player wallet address
    uint256 totalGames;         // Total games played
    uint256 totalWins;          // Number of wins
    uint256 totalLosses;        // Number of losses
    int256 totalProfit;         // Net profit/loss (can be negative)
    uint256 lastGameTime;       // Timestamp of last game
    uint256 largestWin;         // Largest single win
    uint256 largestLoss;        // Largest single loss
}
```

---

## 🚀 Deployment Steps

### Prerequisites
```bash
# Required software:
- Node.js v16+
- npm or yarn
- Hardhat
- MetaMask with Sepolia ETH (testnet funds)
```

### Step 1: Setup Environment Variables

**Create `contracts/.env`:**
```bash
PRIVATE_KEY=0x<YOUR_PRIVATE_KEY_HERE>
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
OWNER_ADDRESS=0x<YOUR_WALLET_ADDRESS>
```

**Get Infura Key:**
1. Go to https://infura.io
2. Sign up and create a project
3. Select Sepolia from dropdown
4. Copy the RPC URL

**Get Test ETH:**
1. Visit https://www.sepoliafaucet.com
2. Connect MetaMask
3. Request test ETH (0.5-1 ETH should be enough)


**3. Test in UI:**
1. Connect MetaMask to Sepolia
2. Deposit some test ETH
3. Play each game (Coin Flip, Range Predictor, Dice Roller)
4. Check leaderboard for your name
5. Verify stats update correctly

---

## 📊 Game Payouts & Probabilities

| Game | Win Chance | Payout | Max Bet | House Edge |
|------|-----------|--------|---------|-----------|
| Coin Flip | 50% | 2x | 0.0001 ETH | ~0% |
| Range Predictor | 50% | 2x | 0.0001 ETH | ~0% |
| Dice Roller | 16.67% | 6x | 0.0001 ETH | ~0% |

**Note:** All games use FHE encryption, making them provably fair!

---

## 🔍 Code Changes Summary

### Smart Contract Changes
- Added `PlayerStats` struct for tracking statistics
- Added `userGameIndices` mapping for per-user game history
- Added `_updatePlayerStats()` internal function
- Added `playDiceRoller()` new game function
- Added leaderboard view functions:
  - `getLeaderboard()`
  - `getLeaderboardByWinRate()`
  - `getTotalPlayers()`
  - `getAllPlayers()`
  - `isPlayerRegistered()`
  - `getPlayerStats()`

### Frontend Changes
- Created `DiceRoller.tsx` component
- Created `Leaderboard.tsx` component
- Created `PlayerStats.tsx` component
- Updated `Dashboard.tsx` to include new games and features
- Added balance refresh callbacks to game components

### Files Modified
- `contracts/GameHouse.sol` - Smart contract with new features
- `frontend/src/components/Dashboard.tsx` - Updated UI
- `frontend/src/components/Games/CoinFlip.tsx` - Added balance callback
- `frontend/src/components/Games/RangePredictor.tsx` - Added balance callback
- `frontend/src/components/Games/DiceRoller.tsx` - New game component
- `frontend/src/components/Leaderboard.tsx` - New leaderboard component
- `frontend/src/components/PlayerStats.tsx` - New stats component

---

## ⚠️ Security Notes

### What's Protected
✅ Player choices (encrypted)
✅ Random numbers (encrypted)
✅ Game outcomes (encrypted hashes only)
✅ Balance calculations (FHE operations)

### What's Public (By Design)
- Bet amounts (for validation)
- Win/loss results (for transparency)
- Player addresses (wallet addresses are public on blockchain)
- Game timestamps (for audit trail)

### Best Practices
1. **Never** share your private key
2. **Always** verify contract address on Etherscan
3. **Use** different wallets for testing vs production
4. **Enable** 2FA on wallet management services
5. **Test** with small amounts first

---

## 🆘 Troubleshooting

### Deployment Failed

**Error: "Insufficient funds"**
- Check Sepolia RPC URL is correct
- Verify you have test ETH from faucet
- Check gas price (may need to adjust in hardhat.config.ts)

**Error: "Invalid private key"**
- Remove "0x" prefix from private key in .env
- Or keep "0x" but check it's 66 characters total
- Never include quotes in .env values

### Games Not Working

**Balance not updating:**
- Wait 2-3 blocks for transaction confirmation
- Refresh page or click balance refresh button
- Check Etherscan for transaction status

**Contract not found:**
- Verify contract address in frontend .env
- Check network is set to Sepolia (Chain ID: 11155111)
- Ensure contract was deployed to Sepolia (not a different network)

**Game won't submit:**
- Check gas balance (need for transaction fees)
- Verify bet amount <= 0.0001 ETH
- Check MetaMask is connected and unlocked

### Leaderboard Empty

- It's normal if no games have been played yet
- Play a few games to populate leaderboard
- Leaderboard updates every 10 seconds

---

## 📈 Gas Optimization Tips

### Contract Optimization
The contract uses FHE operations efficiently:
- Encrypted state variables stored once
- Minimal storage updates per game
- Reused encrypted data structures
- Optimal bit manipulation for randomness

### Frontend Optimization
- Leaderboard data cached every 10 seconds
- Stats auto-refresh every 5 seconds
- Game history fetched on-demand
- Lazy loading for leaderboard components

---

## 🎯 Future Improvements

### Phase 2
- Multi-signature contract management
- Tournament modes with prizes
- Social features (friend challenges)
- Advanced analytics dashboard

### Phase 3
- Mobile app (React Native)
- Cross-chain support
- Token staking for house share
- DAO governance

### Phase 4
- AI-powered predictions
- Advanced FHE operations
- Zero-knowledge tournaments
- Enterprise licensing

---

## 📞 Support

**For Issues:**
1. Check Etherscan for transaction details
2. Review contract code comments
3. Check browser console for errors
4. Verify .env variables are correct

**For Security Issues:**
- Do not share sensitive information publicly
- Report to security contact (if available)
- Use GitHub issues for non-sensitive bugs

---

## 📄 License

MIT License - See LICENSE file for details

---

**Deployment Date:** 2025-12-11
**Contract Version:** 2.0 (Enhanced with Leaderboards & Statistics)
**Network:** Sepolia Testnet
**Chain ID:** 11155111

---

Made with ❤️ for the Encrypted Casino Community
