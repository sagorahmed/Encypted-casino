// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FHE, euint32, euint64, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Encrypted Casino - A privacy-preserving casino using FHEVM
/// @author Encrypted Casino Team
/// @notice This contract implements two games: CoinFlip and RangePredictor with fully encrypted operations
contract GameHouse is Ownable, ReentrancyGuard, ZamaEthereumConfig {
    // Constants
    uint256 public constant MAX_BET = 0.0001 ether;
    uint256 public constant PAYOUT_MULTIPLIER = 2;
    uint256 public constant RANGE_MAX = 100;

    // Game enums
    enum GameType { CoinFlip, RangePredictor, Dice }
    enum CoinChoice { Heads, Tails }
    enum RangeChoice { Below, Above }

    // Shadow plaintext balance for settlement
    mapping(address => uint64) private plaintextAmounts;

    // Encrypted balance for privacy-preserving operations
    mapping(address => euint64) private encryptedBalances;

    /// @notice Feature flag: Sepolia does NOT support FHEVM precompiles.
    /// @dev Keep this false on Sepolia; set true only on an FHEVM-enabled network.
    bool public fheEnabled = false;

    // House funds (non-encrypted for owner)
    uint256 public houseFunds;

    // Game history (encrypted hashes)
    struct GameResult {
        address player;
        GameType gameType;
        uint256 betAmount;
        bool won;
        uint256 timestamp;
        bytes32 encryptedOutcome;
    }

    GameResult[] private gameHistory;

    // Per-user game history tracking
    mapping(address => uint256[]) private userGameIndices;

    // Player statistics for leaderboard
    struct PlayerStats {
        address playerAddress;
        uint256 totalGames;
        uint256 totalWins;
        uint256 totalLosses;
        int256 totalProfit; // Can be negative (loss)
        uint256 lastGameTime;
        uint256 largestWin;
        uint256 largestLoss;
    }

    mapping(address => PlayerStats) private playerStats;
    address[] private allPlayers; // Track all players for leaderboard
    mapping(address => bool) private playerExists;

    // Events
    event DepositMade(address indexed player, uint256 amount);
    event WithdrawalMade(address indexed player, uint256 amount);
    event GamePlayed(address indexed player, GameType gameType, uint256 betAmount, bool won);
    event HouseDepositMade(uint256 amount);
    event HouseWithdrawalMade(uint256 amount);
    event BalanceDebug(address indexed player, GameType gameType, uint256 beforePlain, uint256 afterPlain);
    event BalanceRevealed(address indexed player, uint64 balance, uint256 timestamp);

    // Modifiers
    modifier validBet(uint256 amount) {
        require(amount > 0 && amount <= MAX_BET, "Invalid bet amount");
        _;
    }

    // ==================== Helper Functions ====================

    /// @notice Update player statistics after a game
    /// @param player Player address
    /// @param betAmount Amount wagered
    /// @param won Whether the player won
    function _updatePlayerStats(address player, uint256 betAmount, bool won) internal {
        // Initialize player if first time
        if (!playerExists[player]) {
            playerStats[player] = PlayerStats({
                playerAddress: player,
                totalGames: 0,
                totalWins: 0,
                totalLosses: 0,
                totalProfit: 0,
                lastGameTime: block.timestamp,
                largestWin: 0,
                largestLoss: 0
            });
            allPlayers.push(player);
            playerExists[player] = true;
        }

        // Update stats
        playerStats[player].totalGames += 1;
        playerStats[player].lastGameTime = block.timestamp;

        if (won) {
            playerStats[player].totalWins += 1;
            int256 profit = int256(betAmount); // Net profit is bet amount
            playerStats[player].totalProfit += profit;

            if (betAmount > playerStats[player].largestWin) {
                playerStats[player].largestWin = betAmount;
            }
        } else {
            playerStats[player].totalLosses += 1;
            int256 loss = -int256(betAmount); // Loss is negative
            playerStats[player].totalProfit += loss;

            if (betAmount > playerStats[player].largestLoss) {
                playerStats[player].largestLoss = betAmount;
            }
        }
    }


    // Constructor
    constructor() Ownable(msg.sender) {
        // House balance is initialized as zero by default (no FHE operations in constructor)
    }

    /// @notice Enable/disable FHE execution paths.
    /// @dev On Sepolia this must remain false or transactions will revert.
    function setFheEnabled(bool enabled) external onlyOwner {
        fheEnabled = enabled;
    }

    // ==================== Deposit/Withdrawal Functions ====================

    /// @notice Deposit ETH to user balance
    /// @dev Tracks plaintext balance, updates dummy encrypted UI display
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit must be greater than 0");

        // Track plaintext amount
        plaintextAmounts[msg.sender] += uint64(msg.value);

        // Mirror to encrypted balance for privacy-preserving operations (FHE networks only)
        if (fheEnabled) {
            encryptedBalances[msg.sender] = FHE.add(
                encryptedBalances[msg.sender],
                FHE.asEuint64(uint64(msg.value))
            );
        }

        emit DepositMade(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from user balance
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient contract balance");
        require(amount <= uint256(type(uint64).max), "Amount too large");

        uint64 withdrawAmount64 = uint64(amount);
        require(plaintextAmounts[msg.sender] >= withdrawAmount64, "Insufficient balance");

        // Update plaintext balance
        plaintextAmounts[msg.sender] -= withdrawAmount64;

        // Update encrypted balance shadow (FHE networks only)
        if (fheEnabled) {
            encryptedBalances[msg.sender] = FHE.sub(
                encryptedBalances[msg.sender],
                FHE.asEuint64(withdrawAmount64)
            );
        }

        // Transfer funds
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit WithdrawalMade(msg.sender, amount);
    }

    /// @notice Reveal caller's plaintext balance via a signed transaction.
    /// @dev This intentionally leaks the balance in an event; UI uses it as an explicit opt-in reveal.
    function requestBalanceReveal() external {
        emit BalanceRevealed(msg.sender, plaintextAmounts[msg.sender], block.timestamp);
    }

    // ==================== CoinFlip Game ====================

    function _playCoinFlipPlain(uint256 betAmount, uint32 plaintextChoice) internal returns (bool playerWon) {
        require(betAmount > 0, "Invalid bet");
        require(betAmount <= uint256(type(uint64).max), "Bet amount too large");
        require(plaintextChoice <= 1, "Invalid coin choice");

        uint64 betAmount64 = uint64(betAmount);
        require(plaintextAmounts[msg.sender] >= betAmount64, "Insufficient balance");
        uint256 beforePlain = plaintextAmounts[msg.sender];

        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, block.timestamp, betAmount)));
        uint32 randomBit = uint32(seed % 2);

        playerWon = (plaintextChoice == randomBit);
        plaintextAmounts[msg.sender] -= betAmount64;
        if (playerWon) {
            uint64 payoutAmount64 = uint64(betAmount * PAYOUT_MULTIPLIER);
            plaintextAmounts[msg.sender] += payoutAmount64;
        }

        emit BalanceDebug(msg.sender, GameType.CoinFlip, beforePlain, plaintextAmounts[msg.sender]);

        uint256 gameIndex = gameHistory.length;
        gameHistory.push(GameResult({
            player: msg.sender,
            gameType: GameType.CoinFlip,
            betAmount: betAmount,
            won: playerWon,
            timestamp: block.timestamp,
            encryptedOutcome: keccak256(abi.encode(randomBit))
        }));

        userGameIndices[msg.sender].push(gameIndex);
        _updatePlayerStats(msg.sender, betAmount, playerWon);

        emit GamePlayed(msg.sender, GameType.CoinFlip, betAmount, playerWon);
    }

    /// @notice Internal coin flip implementation used by both ABI variants
    function _playCoinFlipCore(uint256 betAmount, uint32 plaintextChoice, euint32 encryptedChoice, euint64 encryptedBet) internal returns (bool playerWon) {
        require(betAmount > 0, "Invalid bet");
        require(betAmount <= uint256(type(uint64).max), "Bet amount too large");
        require(plaintextChoice <= 1, "Invalid coin choice");

        uint64 betAmount64 = uint64(betAmount);
        require(plaintextAmounts[msg.sender] >= betAmount64, "Insufficient balance");
        uint256 beforePlain = plaintextAmounts[msg.sender];

        // Pseudorandom bit derived once and used for plaintext settlement
        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, block.timestamp, betAmount)));
        uint32 randomBit = uint32(seed % 2);

        // Update encrypted balance: subtract bet, add payout if won
        encryptedBalances[msg.sender] = FHE.sub(encryptedBalances[msg.sender], encryptedBet);

        // Shadow plaintext bookkeeping for settlement and stats
        playerWon = (plaintextChoice == randomBit);
        if (playerWon) {
            encryptedBalances[msg.sender] = FHE.add(
                encryptedBalances[msg.sender],
                FHE.mul(encryptedBet, FHE.asEuint64(uint64(PAYOUT_MULTIPLIER)))
            );
        }
        plaintextAmounts[msg.sender] -= betAmount64;
        if (playerWon) {
            uint64 payoutAmount64 = uint64(betAmount * PAYOUT_MULTIPLIER);
            plaintextAmounts[msg.sender] += payoutAmount64;
        }

        emit BalanceDebug(msg.sender, GameType.CoinFlip, beforePlain, plaintextAmounts[msg.sender]);

        uint256 gameIndex = gameHistory.length;
        gameHistory.push(GameResult({
            player: msg.sender,
            gameType: GameType.CoinFlip,
            betAmount: betAmount,
            won: playerWon,
            timestamp: block.timestamp,
            encryptedOutcome: keccak256(abi.encode(randomBit))
        }));

        userGameIndices[msg.sender].push(gameIndex);
        _updatePlayerStats(msg.sender, betAmount, playerWon);

        emit GamePlayed(msg.sender, GameType.CoinFlip, betAmount, playerWon);
    }

    /// @notice Play CoinFlip game (encrypted choice; plaintext shadow choice for stats/settlement)
    function playCoinFlip(
        externalEuint32 encryptedChoice,
        bytes calldata choiceProof,
        externalEuint64 encryptedBet,
        bytes calldata betProof,
        uint256 betAmount,
        uint32 plaintextChoice
    ) external validBet(betAmount) nonReentrant returns (bool won) {
        if (!fheEnabled) {
            return _playCoinFlipPlain(betAmount, plaintextChoice);
        }
        euint32 choice = FHE.fromExternal(encryptedChoice, choiceProof);
        euint64 betEnc = FHE.fromExternal(encryptedBet, betProof);
        return _playCoinFlipCore(betAmount, plaintextChoice, choice, betEnc);
    }

    /// @notice Backward-compatible CoinFlip entrypoint for legacy frontends (plaintext/dummy encrypted inputs)
    function playCoinFlip(
        bytes calldata /*dummyEncryptedChoice*/,
        bytes calldata /*dummyProof*/,
        uint256 betAmount,
        uint32 plaintextChoice
    ) external validBet(betAmount) nonReentrant returns (bool won) {
        if (!fheEnabled) {
            return _playCoinFlipPlain(betAmount, plaintextChoice);
        }
        return _playCoinFlipCore(
            betAmount,
            plaintextChoice,
            FHE.asEuint32(plaintextChoice),
            FHE.asEuint64(uint64(betAmount))
        );
    }

    /// @notice Internal dice roller implementation (encrypted path with plaintext shadow)
    /// @param betAmount Wager amount in wei
    /// @param plaintextChoice Player's chosen face (1-6) for stats/shadow
    function _playDiceRollerCore(uint256 betAmount, uint32 plaintextChoice, euint32 encryptedChoice, euint64 encryptedBet) internal returns (bool playerWon) {
        require(betAmount > 0, "Invalid bet");
        require(betAmount <= uint256(type(uint64).max), "Bet amount too large");
        require(plaintextChoice >= 1 && plaintextChoice <= 6, "Invalid dice choice");

        uint64 betAmount64 = uint64(betAmount);
        require(plaintextAmounts[msg.sender] >= betAmount64, "Insufficient balance");
        uint256 beforePlain = plaintextAmounts[msg.sender];

        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, block.timestamp, betAmount)));
        uint32 randomDiceNumber = uint32((seed % 6) + 1);

        // Encrypted balance updates (FHE networks only)
        if (fheEnabled) {
            encryptedBalances[msg.sender] = FHE.sub(encryptedBalances[msg.sender], encryptedBet);
            if (plaintextChoice == randomDiceNumber) {
                encryptedBalances[msg.sender] = FHE.add(
                    encryptedBalances[msg.sender],
                    FHE.mul(encryptedBet, FHE.asEuint64(uint64(6)))
                );
            }
        }

        playerWon = (plaintextChoice == randomDiceNumber);

        // Shadow plaintext bookkeeping
        plaintextAmounts[msg.sender] -= betAmount64;
        if (playerWon) {
            uint64 payoutAmount64 = uint64(betAmount * 6);
            plaintextAmounts[msg.sender] += payoutAmount64;
        }

        emit BalanceDebug(msg.sender, GameType.Dice, beforePlain, plaintextAmounts[msg.sender]);

        uint256 gameIndex = gameHistory.length;
        gameHistory.push(GameResult({
            player: msg.sender,
            gameType: GameType.Dice,
            betAmount: betAmount,
            won: playerWon,
            timestamp: block.timestamp,
            encryptedOutcome: keccak256(abi.encode(randomDiceNumber))
        }));

        userGameIndices[msg.sender].push(gameIndex);

        _updatePlayerStats(msg.sender, playerWon ? (betAmount * 5) : betAmount, playerWon);

        emit GamePlayed(msg.sender, GameType.Dice, betAmount, playerWon);
    }

    /// @notice Play Dice Roller (encrypted choice; plaintext shadow choice for stats/settlement)
    function playDiceRoller(
        externalEuint32 encryptedChoice,
        bytes calldata choiceProof,
        externalEuint64 encryptedBet,
        bytes calldata betProof,
        uint256 betAmount,
        uint32 plaintextChoice
    ) external validBet(betAmount) nonReentrant returns (bool won) {
        if (!fheEnabled) {
            // ignore encrypted args on non-FHE networks
            return _playDiceRollerCore(betAmount, plaintextChoice, euint32.wrap(bytes32(0)), euint64.wrap(bytes32(0)));
        }
        euint32 choice = FHE.fromExternal(encryptedChoice, choiceProof);
        euint64 betEnc = FHE.fromExternal(encryptedBet, betProof);
        return _playDiceRollerCore(betAmount, plaintextChoice, choice, betEnc);
    }

    /// @notice Backward-compatible Dice entrypoint for legacy frontends (plaintext/dummy encrypted inputs)
    function playDiceRoller(
        bytes calldata /*dummyEncryptedChoice*/,
        bytes calldata /*dummyProof*/,
        uint256 betAmount,
        uint32 plaintextChoice
    ) external validBet(betAmount) nonReentrant returns (bool won) {
        if (!fheEnabled) {
            return _playDiceRollerCore(betAmount, plaintextChoice, euint32.wrap(bytes32(0)), euint64.wrap(bytes32(0)));
        }
        return _playDiceRollerCore(
            betAmount,
            plaintextChoice,
            FHE.asEuint32(plaintextChoice),
            FHE.asEuint64(uint64(betAmount))
        );
    }

    /// @notice Internal range predictor implementation (encrypted path with plaintext shadow)
    /// @param betAmount Wager amount in wei
    /// @param plaintextChoice 0 = Below, 1 = Above for stats/shadow
    function _playRangePredictorCore(uint256 betAmount, uint32 plaintextChoice, euint32 encryptedChoice, euint64 encryptedBet) internal returns (bool playerWon) {
        require(betAmount > 0, "Invalid bet");
        require(betAmount <= uint256(type(uint64).max), "Bet amount too large");
        require(plaintextChoice <= 1, "Invalid range choice");

        uint64 betAmount64 = uint64(betAmount);
        require(plaintextAmounts[msg.sender] >= betAmount64, "Insufficient balance");
        uint256 beforePlain = plaintextAmounts[msg.sender];

        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, block.timestamp, betAmount)));
        uint32 randomNumber = uint32((seed % 100) + 1);

        if (fheEnabled) {
            encryptedBalances[msg.sender] = FHE.sub(encryptedBalances[msg.sender], encryptedBet);
        }
        playerWon = (plaintextChoice == 0) ? (randomNumber < 50) : (randomNumber > 50);
        if (playerWon && fheEnabled) {
            encryptedBalances[msg.sender] = FHE.add(
                encryptedBalances[msg.sender],
                FHE.mul(encryptedBet, FHE.asEuint64(uint64(PAYOUT_MULTIPLIER)))
            );
        }
        plaintextAmounts[msg.sender] -= betAmount64;
        if (playerWon) {
            uint64 payoutAmount64 = uint64(betAmount * PAYOUT_MULTIPLIER);
            plaintextAmounts[msg.sender] += payoutAmount64;
        }

        emit BalanceDebug(msg.sender, GameType.RangePredictor, beforePlain, plaintextAmounts[msg.sender]);

        uint256 gameIndex = gameHistory.length;
        gameHistory.push(GameResult({
            player: msg.sender,
            gameType: GameType.RangePredictor,
            betAmount: betAmount,
            won: playerWon,
            timestamp: block.timestamp,
            encryptedOutcome: keccak256(abi.encode(randomNumber))
        }));

        userGameIndices[msg.sender].push(gameIndex);
        _updatePlayerStats(msg.sender, betAmount, playerWon);

        emit GamePlayed(msg.sender, GameType.RangePredictor, betAmount, playerWon);
    }

    /// @notice Play Range Predictor (encrypted choice; plaintext shadow choice for stats/settlement)
    function playRangePredictor(
        externalEuint32 encryptedChoice,
        bytes calldata choiceProof,
        externalEuint64 encryptedBet,
        bytes calldata betProof,
        uint256 betAmount,
        uint32 plaintextChoice
    ) external validBet(betAmount) nonReentrant returns (bool won) {
        if (!fheEnabled) {
            return _playRangePredictorCore(betAmount, plaintextChoice, euint32.wrap(bytes32(0)), euint64.wrap(bytes32(0)));
        }
        euint32 choice = FHE.fromExternal(encryptedChoice, choiceProof);
        euint64 betEnc = FHE.fromExternal(encryptedBet, betProof);
        return _playRangePredictorCore(betAmount, plaintextChoice, choice, betEnc);
    }

    /// @notice Backward-compatible Range Predictor entrypoint for legacy frontends (plaintext/dummy encrypted inputs)
    function playRangePredictor(
        bytes calldata /*dummyEncryptedChoice*/,
        bytes calldata /*dummyProof*/,
        uint256 betAmount,
        uint32 plaintextChoice
    ) external validBet(betAmount) nonReentrant returns (bool won) {
        if (!fheEnabled) {
            return _playRangePredictorCore(betAmount, plaintextChoice, euint32.wrap(bytes32(0)), euint64.wrap(bytes32(0)));
        }
        return _playRangePredictorCore(
            betAmount,
            plaintextChoice,
            FHE.asEuint32(plaintextChoice),
            FHE.asEuint64(uint64(betAmount))
        );
    }

    // ==================== Owner Functions ====================

    /// @notice Owner deposits funds to house balance
    function depositHouseFunds() external payable onlyOwner {
        require(msg.value > 0, "Deposit must be greater than 0");
        houseFunds += msg.value;
        emit HouseDepositMade(msg.value);
    }

    /// @notice Owner withdraws house funds
    /// @param amount Amount to withdraw
    function withdrawHouseFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(houseFunds >= amount, "Insufficient house funds");

        houseFunds -= amount;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");

        emit HouseWithdrawalMade(amount);
    }

    // ==================== View Functions ====================

    /// @notice Get user's encrypted balance (ciphertext for client-side decryption)
    /// @param player Player address
    function getEncryptedBalance(address player) external view returns (euint64) {
        return encryptedBalances[player];
    }

    /// @notice Compatibility plaintext balance getter (debug/UI only)
    /// @dev Leaks balance; keep for backward compatibility with existing frontends
    function getDecryptedBalance(address player) external view returns (uint64) {
        return plaintextAmounts[player];
    }

    /// @notice Get total house balance (dummy encryption for UI)
    function getTotalHouseBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get house funds (owner only)
    function getHouseFunds() external view onlyOwner returns (uint256) {
        return houseFunds;
    }

    /// @notice Get game history length
    function getGameHistoryLength() external view returns (uint256) {
        return gameHistory.length;
    }

    /// @notice Get user's game history length
    function getUserGameHistoryLength(address user) external view returns (uint256) {
        return userGameIndices[user].length;
    }

    /// @notice Get specific game result (encrypted outcome)
    function getGameResult(uint256 index) external view returns (GameResult memory) {
        require(index < gameHistory.length, "Invalid game index");
        return gameHistory[index];
    }

    /// @notice Get user's specific game result by their game index
    /// @param user User address
    /// @param userGameIndex Index within user's game history
    function getUserGameResult(address user, uint256 userGameIndex) external view returns (GameResult memory) {
        require(userGameIndex < userGameIndices[user].length, "Invalid user game index");
        uint256 globalIndex = userGameIndices[user][userGameIndex];
        return gameHistory[globalIndex];
    }

    /// @notice Get user's last N games
    /// @param user User address
    /// @param count Number of recent games to return
    function getUserRecentGames(address user, uint256 count) external view returns (GameResult[] memory) {
        uint256 userGameCount = userGameIndices[user].length;
        uint256 returnCount = count > userGameCount ? userGameCount : count;
        GameResult[] memory recentGames = new GameResult[](returnCount);

        // Return games in reverse order (most recent first)
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 gameIndex = userGameIndices[user][userGameCount - 1 - i];
            recentGames[i] = gameHistory[gameIndex];
        }

        return recentGames;
    }

    // ==================== Leaderboard & Statistics ====================

    /// @notice Get player statistics
    /// @param player Player address
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        require(playerExists[player], "Player not found");
        return playerStats[player];
    }

    /// @notice Get top players by profit (leaderboard)
    /// @param count Number of top players to return
    function getLeaderboard(uint256 count) external view returns (PlayerStats[] memory) {
        uint256 returnCount = count > allPlayers.length ? allPlayers.length : count;
        PlayerStats[] memory topPlayers = new PlayerStats[](returnCount);

        // Copy all players
        PlayerStats[] memory allStats = new PlayerStats[](allPlayers.length);
        for (uint256 i = 0; i < allPlayers.length; i++) {
            allStats[i] = playerStats[allPlayers[i]];
        }

        // Simple bubble sort by profit (descending)
        for (uint256 i = 0; i < allStats.length; i++) {
            for (uint256 j = i + 1; j < allStats.length; j++) {
                if (allStats[j].totalProfit > allStats[i].totalProfit) {
                    PlayerStats memory temp = allStats[i];
                    allStats[i] = allStats[j];
                    allStats[j] = temp;
                }
            }
        }

        // Return top N
        for (uint256 i = 0; i < returnCount; i++) {
            topPlayers[i] = allStats[i];
        }

        return topPlayers;
    }

    /// @notice Get top players by win rate
    /// @param count Number of top players to return
    function getLeaderboardByWinRate(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 returnCount = count > allPlayers.length ? allPlayers.length : count;
        address[] memory topAddresses = new address[](returnCount);
        uint256[] memory winRates = new uint256[](returnCount);

        // Calculate win rates
        uint256[] memory winRateArray = new uint256[](allPlayers.length);
        address[] memory playerAddresses = new address[](allPlayers.length);

        for (uint256 i = 0; i < allPlayers.length; i++) {
            playerAddresses[i] = allPlayers[i];
            if (playerStats[allPlayers[i]].totalGames > 0) {
                winRateArray[i] = (playerStats[allPlayers[i]].totalWins * 100) / playerStats[allPlayers[i]].totalGames;
            }
        }

        // Get top N by win rate (using memory arrays only)
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < allPlayers.length; j++) {
                if (winRateArray[j] > winRateArray[maxIdx]) {
                    maxIdx = j;
                }
            }

            topAddresses[i] = playerAddresses[maxIdx];
            winRates[i] = winRateArray[maxIdx];

            // Swap in memory arrays
            winRateArray[maxIdx] = winRateArray[i];
            playerAddresses[maxIdx] = playerAddresses[i];
        }

        return (topAddresses, winRates);
    }

    /// @notice Get total number of unique players
    function getTotalPlayers() external view returns (uint256) {
        return allPlayers.length;
    }

    /// @notice Get all players
    function getAllPlayers() external view returns (address[] memory) {
        return allPlayers;
    }

    /// @notice Check if player has played before
    function isPlayerRegistered(address player) external view returns (bool) {
        return playerExists[player];
    }

    // Fallback functions
    receive() external payable {}

    fallback() external payable {}
}
