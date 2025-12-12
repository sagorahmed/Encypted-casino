import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { CoinFlip } from "./Games/CoinFlip";
import { RangePredictor } from "./Games/RangePredictor";
import { DiceRoller } from "./Games/DiceRoller";
import { DepositWithdraw } from "./Wallet/Deposit";
import { BalanceDisplay } from "./Wallet/Balance";
import { DashboardFooter } from "./DashboardFooter";
import { PlayerStats } from "./PlayerStats";
import { Leaderboard } from "./Leaderboard";
import { parseAbi } from "viem";

interface DashboardProps {
  contractAddress: string;
}

interface GameRecord {
  game: string;
  won: boolean;
  time: string;
  betAmount: string;
}

const GAME_HOUSE_ABI = parseAbi([
  "function getUserRecentGames(address user, uint256 count) external view returns ((address player, uint8 gameType, uint256 betAmount, bool won, uint256 timestamp, bytes32 encryptedOutcome)[])",
]);

export const Dashboard: React.FC<DashboardProps> = ({ contractAddress }) => {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const [activeGame, setActiveGame] = useState<"none" | "coinflip" | "rangepred" | "dice">("none");
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [revealedBalanceHintEth, setRevealedBalanceHintEth] = useState<string | null>(null);

  // Fetch user's game history from smart contract
  const fetchUserGameHistory = async () => {
    if (!isConnected || !address || !publicClient || !contractAddress) return;

    try {
      const resolvedAddress = contractAddress as `0x${string}`;
      const games = await publicClient.readContract({
        address: resolvedAddress,
        abi: GAME_HOUSE_ABI,
        functionName: "getUserRecentGames",
        args: [address, 15n],
      });

      const formattedGames: GameRecord[] = (games as any[]).map((game: any) => ({
        game: game.gameType === 0 ? "Coin Flip" : game.gameType === 1 ? "Range Predictor" : "Dice Roller",
        won: game.won,
        time: new Date(Number(game.timestamp) * 1000).toLocaleTimeString(),
        betAmount: (Number(game.betAmount) / 1e18).toFixed(6),
      }));

      setGameHistory(formattedGames);
    } catch (error) {
      console.error("Error fetching user game history:", error);
      // Fall back to empty history if contract not available
    }
  };

  // Load history on mount and when refresh is triggered
  useEffect(() => {
    fetchUserGameHistory();
  }, [isConnected, address, contractAddress, publicClient, refreshTrigger]);

  const handleGameResult = (_gameType: string, _won: boolean) => {
    // Trigger history refresh after game result
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      setStatsRefreshTrigger(prev => prev + 1);
    }, 1000);
  };

  const handleBalanceUpdate = (newBalanceEth?: string) => {
    if (newBalanceEth) setRevealedBalanceHintEth(newBalanceEth);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-dark via-slate-900 to-casino-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-casino-purple to-casino-gold mb-2">
            🎰 Encrypted Casino
          </h1>
          <p className="text-gray-400">
            Secure, privacy-preserving casino gaming with FHEVM encryption
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-casino-purple/10 border border-casino-purple/30 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">Please connect your wallet to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Balance & Transactions */}
            <div className="lg:col-span-1 space-y-6">
              <BalanceDisplay
                contractAddress={contractAddress}
                refreshTrigger={refreshTrigger}
                revealedBalanceHintEth={revealedBalanceHintEth}
              />
              <DepositWithdraw
                onWithdraw={() => handleBalanceUpdate()}
                onBalanceUpdate={(newBal) => handleBalanceUpdate(newBal)}
              />

              {/* Recent History */}
              {gameHistory.length > 0 && (
                <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Your Recent Games</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {gameHistory.map((result, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center text-sm rounded px-3 py-2 border-l-4 ${
                          result.won
                            ? "bg-green-900/20 border-green-500"
                            : "bg-red-900/20 border-red-500"
                        }`}
                      >
                        <div className="flex-1">
                          <span className="text-gray-300 font-medium">{result.game}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            {result.betAmount} ETH
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold ${
                              result.won ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {result.won ? "✅ Won" : "❌ Lost"}
                          </span>
                          <span className="text-gray-500 text-xs block">
                            {result.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Games */}
            <div className="lg:col-span-2">
              {activeGame === "none" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white mb-6">Select a Game</h2>

                  <button
                    onClick={() => setActiveGame("coinflip")}
                    className="w-full bg-gradient-to-br from-casino-purple/30 to-slate-900 border border-casino-purple/50 rounded-lg p-6 hover:border-casino-purple transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-casino-gold transition-colors">
                          🪙 Coin Flip
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Guess heads or tails. Win 2x your bet!
                        </p>
                        <div className="mt-3 text-xs text-casino-gold">
                          Chance: 50% | Payout: 2x
                        </div>
                      </div>
                      <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">→</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveGame("rangepred")}
                    className="w-full bg-gradient-to-br from-casino-purple/30 to-slate-900 border border-casino-purple/50 rounded-lg p-6 hover:border-casino-purple transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-casino-gold transition-colors">
                          📊 Range Predictor
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Predict if the number is above or below 50. Win 2x your bet!
                        </p>
                        <div className="mt-3 text-xs text-casino-gold">
                          Chance: 50% | Payout: 2x
                        </div>
                      </div>
                      <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">→</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveGame("dice")}
                    className="w-full bg-gradient-to-br from-casino-purple/30 to-slate-900 border border-casino-purple/50 rounded-lg p-6 hover:border-casino-purple transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-casino-gold transition-colors">
                          🎲 Dice Roller
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Pick a number 1-6. Win 6x your bet if it matches!
                        </p>
                        <div className="mt-3 text-xs text-casino-gold">
                          Chance: 16.67% | Payout: 6x
                        </div>
                      </div>
                      <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">→</div>
                    </div>
                  </button>

                  {/* Leaderboard Toggle */}
                  <button
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    className="w-full mt-4 bg-gradient-to-br from-casino-gold/20 to-casino-purple/20 border border-casino-gold/30 rounded-lg p-4 hover:border-casino-gold transition-all group"
                  >
                    <span className="text-white font-semibold">
                      🏆 {showLeaderboard ? "Hide" : "View"} Leaderboard
                    </span>
                  </button>

                  {/* Features */}
                  <div className="mt-8 grid grid-cols-2 gap-4 pt-4 border-t border-casino-purple/30">
                    <div className="text-center">
                      <p className="text-casino-gold text-2xl mb-1">🔒</p>
                      <p className="text-xs text-gray-400">FHE Encrypted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-casino-gold text-2xl mb-1">⚡</p>
                      <p className="text-xs text-gray-400">Fast Payouts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-casino-gold text-2xl mb-1">🎰</p>
                      <p className="text-xs text-gray-400">Fair Gaming</p>
                    </div>
                    <div className="text-center">
                      <p className="text-casino-gold text-2xl mb-1">🌐</p>
                      <p className="text-xs text-gray-400">Web3 Native</p>
                    </div>
                  </div>
                </div>
              )}

              {activeGame === "coinflip" && (
                <div>
                  <button
                    onClick={() => setActiveGame("none")}
                    className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                  >
                    ← Back to Games
                  </button>
                  <CoinFlip
                    contractAddress={contractAddress}
                    onGameResult={(won) => handleGameResult("Coin Flip", won)}
                    onBalanceUpdate={handleBalanceUpdate}
                  />
                </div>
              )}

              {activeGame === "rangepred" && (
                <div>
                  <button
                    onClick={() => setActiveGame("none")}
                    className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                  >
                    ← Back to Games
                  </button>
                  <RangePredictor
                    contractAddress={contractAddress}
                    onGameResult={(won) => handleGameResult("Range Predictor", won)}
                    onBalanceUpdate={handleBalanceUpdate}
                  />
                </div>
              )}

              {activeGame === "dice" && (
                <div>
                  <button
                    onClick={() => setActiveGame("none")}
                    className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                  >
                    ← Back to Games
                  </button>
                  <DiceRoller
                    contractAddress={contractAddress}
                    onGameResult={(won) => handleGameResult("Dice Roller", won)}
                    onBalanceUpdate={handleBalanceUpdate}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      {showLeaderboard && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Leaderboard contractAddress={contractAddress} />
        </div>
      )}

      {/* Player Stats Section (always visible when connected) */}
      {isConnected && !showLeaderboard && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PlayerStats contractAddress={contractAddress} refreshTrigger={statsRefreshTrigger} />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <DashboardFooter />
      </div>
    </div>
  );
};
