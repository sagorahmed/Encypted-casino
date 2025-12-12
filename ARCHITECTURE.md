# Encrypted Casino - Architecture & Technical Design

## Overview

The Encrypted Casino is a Web3-based gambling platform that leverages **Zama's FHEVM** to perform all game logic and balance calculations on encrypted data. This ensures complete player privacy while maintaining cryptographic fairness guarantees.

## System Architecture

### 1. Smart Contract Layer (GameHouse.sol)

#### Core Components

```
┌─────────────────────────────────────────────────┐
│              GameHouse.sol                       │
│        (FHEVM Smart Contract)                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Encrypted State Variables:                    │
│  ├─ mapping(addr => euint64) balances         │
│  ├─ euint64 totalHouseBalance                 │
│  └─ GameResult[] gameHistory                  │
│                                                 │
│  Core Functions:                               │
│  ├─ deposit() / withdraw()                    │
│  ├─ playCoinFlip()                            │
│  ├─ playRangePredictor()                      │
│  └─ Owner management functions                │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Encrypted Data Types

- **euint32**: Encrypted 32-bit unsigned integer
  - Used for encrypted choices (0-1 for coin flip)
  - Used for random number generation
  
- **euint64**: Encrypted 64-bit unsigned integer
  - Used for encrypted balances
  - Used for encrypted payouts
  
- **ebool**: Encrypted boolean
  - Used for FHE comparisons
  - Used in FHE selection operations

### 2. FHE Operations Flow

#### Coin Flip Game Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Player's Browser (fhevmjs)                          │
│    - Encrypt choice: [0=Heads, 1=Tails]               │
│    - Generate proof                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Smart Contract (GameHouse.sol)                      │
│    - Receive encrypted choice                          │
│    - Verify ZK proof                                   │
│    - Generate encrypted random bit                     │
│    - euint32 randomBit = FHE.rem(FHE.randEuint32(), 2)│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. FHE Comparison (on-chain)                           │
│    - ebool isWinner = FHE.eq(choice, randomBit)       │
│    - No plaintext exposure                             │
│    - Result stays encrypted                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Encrypted Payout Calculation                        │
│    - euint32 payout = FHE.select(                      │
│        isWinner,                                       │
│        betAmount * 2,                                  │
│        0                                               │
│      )                                                  │
│    - Payout remains encrypted                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Balance Update (encrypted)                          │
│    - balance += encryptedPayout                        │
│    - Player can decrypt their balance with private key │
└─────────────────────────────────────────────────────────┘
```

#### Range Predictor Game Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Encrypted Choice                                     │
│    - Player encrypts: [0=Below50, 1=Above50]          │
│    - Proof generated                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Encrypted RNG                                        │
│    - randomNum = FHE.add(                             │
│        FHE.rem(FHE.randEuint32(), 100),               │
│        1                                               │
│      )  // Range [1-100]                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. FHE Comparisons                                      │
│    - isBelowMidpoint = FHE.lt(randomNum, 50)          │
│    - choiceIsBelow = FHE.eq(choice, 0)                │
│                                                        │
│    - Match conditions:                                │
│    - isWinner = (choiceIsBelow AND isBelowMidpoint)   │
│                 OR                                     │
│                 (NOT choiceIsBelow AND NOT below)     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4-5. Encrypted Payout & Balance Update                 │
│    (Same as CoinFlip)                                  │
└─────────────────────────────────────────────────────────┘
```

### 3. Frontend Architecture

```
┌──────────────────────────────────────────────────────┐
│           Next.js 14 Frontend                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Pages:                                             │
│  ├─ /                    (Player Dashboard)         │
│  └─ /owner-dashboard     (Owner Controls)           │
│                                                      │
│  Components:                                        │
│  ├─ Dashboard            (Game selection)           │
│  ├─ OwnerDashboard       (House management)         │
│  ├─ Games/               (Game UIs)                 │
│  │  ├─ CoinFlip.tsx                               │
│  │  └─ RangePredictor.tsx                          │
│  └─ Wallet/              (Web3 integration)         │
│     ├─ Connection.tsx                              │
│     ├─ Balance.tsx                                 │
│     └─ Deposit.tsx                                 │
│                                                      │
│  Libraries:                                         │
│  ├─ fhevmjs            (FHE encryption)            │
│  ├─ wagmi/viem         (Wallet connection)         │
│  ├─ ethers.js          (Blockchain interaction)    │
│  └─ Tailwind CSS       (Styling)                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4. Wallet Integration

```
┌─────────────────────────────────────────┐
│     RainbowKit (Connection UI)          │
│     + Wagmi (State Management)          │
│     + Viem (RPC Layer)                  │
└─────────────────────────────────────────┘
                    ↓
      ┌─────────────────────────┐
      │  Wallet Providers:      │
      │  ├─ MetaMask           │
      │  ├─ WalletConnect      │
      │  ├─ Coinbase           │
      │  └─ Others             │
      └─────────────────────────┘
                    ↓
      ┌─────────────────────────┐
      │  FHEVM Testnet (9000)  │
      │  RPC: localhost:8545    │
      └─────────────────────────┘
```

## Data Flow

### User Deposit

```
User Input (0.0001 ETH)
    ↓
Wagmi sends transaction
    ↓
deposit() function executes
    ↓
Value converted to euint64
    ↓
Encrypted balance updated
    ↓
FHE permissions set (user can view)
    ↓
Event emitted
    ↓
User can decrypt balance with private key
```

### Game Execution

```
User selects game & bet amount
    ↓
Frontend encrypts choice with fhevmjs
    ↓
Smart contract receives encrypted parameters
    ↓
FHE operations executed (comparisons, RNG, calculations)
    ↓
All computations stay encrypted
    ↓
Balance updated with encrypted amounts
    ↓
Game result stored (encrypted outcome hash)
    ↓
Frontend displays result
    ↓
Balance can be decrypted by user for verification
```

## Security Model

### 1. Confidentiality
- **Game Choices**: Encrypted using FHE, never exposed in plaintext
- **Balances**: Stored as encrypted values on-chain
- **Outcomes**: Calculation hashes stored, actual values encrypted
- **RNG**: Generated as encrypted values, never exposed

### 2. Integrity
- **FHE Operations**: Cryptographically sound computations
- **Zero-Knowledge**: Proofs verify correctness without revealing plaintext
- **Immutable History**: Game results recorded on-chain

### 3. Availability
- **Smart Contract**: Always accessible on-chain
- **Decentralized**: No single point of failure
- **Transparent**: All game logic publicly verifiable

### 4. Fairness
- **RNG**: FHE-generated, unpredictable before commitment
- **No Front-Running**: Encrypted until block finalized
- **Deterministic Outcomes**: Based on encrypted on-chain data

## Gas Optimization

### FHE Operations Cost

```
Operation                    Estimated Gas
─────────────────────────────────────────
FHE.add(euint32, euint32)   ~500k
FHE.eq(euint32, euint32)    ~600k
FHE.lt(euint32, euint32)    ~600k
FHE.select()                ~800k
FHE.randEuint32()           ~1M

Full Game Execution         ~3-4M per game
```

### Optimization Strategies

1. **Batch Operations**: Combine multiple FHE ops
2. **Lazy Evaluation**: Only compute when needed
3. **Caching**: Store intermediate encrypted values
4. **Library Functions**: Reuse in FHEGameLogic

## Deployment Architecture

### Testnet (Local Node)

```
┌──────────────────────────┐
│  Hardhat Local Node      │
│  (FHEVM-enabled)         │
│  Port: 8545              │
└──────────────────────────┘
           ↓
┌──────────────────────────┐
│  GameHouse Contract      │
│  Deployed                │
└──────────────────────────┘
           ↓
┌──────────────────────────┐
│  Frontend (localhost:3000)│
│  Connected               │
└──────────────────────────┘
```


## Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| Deposit | ~5-10 seconds |
| Game Play | ~15-30 seconds |
| Withdrawal | ~10-15 seconds |
| Balance Query | ~2-3 seconds |
| Gas per Game | 3-4M units |

## Future Improvements

### Phase 2
- [ ] Encrypted leaderboard with FHE aggregation
- [ ] Multi-game sessions
- [ ] Referral tracking (encrypted)

### Phase 3
- [ ] Cross-chain support
- [ ] Advanced analytics dashboard
- [ ] Stake-based games
- [ ] Tournament mode with FHE

### Phase 4
- [ ] Mobile app
- [ ] Voice/UI accessibility
- [ ] Advanced privacy features
- [ ] Distributed oracle integration

---

**Document Version**: 1.0  
**Last Updated**: December 2025
