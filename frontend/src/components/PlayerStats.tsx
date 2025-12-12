import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther, parseAbi } from "viem";

interface PlayerStatsProps {
  contractAddress?: string;
  refreshTrigger?: number;
}

interface PlayerStats {
  playerAddress: string;
  totalGames: bigint;
  totalWins: bigint;
  totalLosses: bigint;
  totalProfit: bigint;
  lastGameTime: bigint;
  largestWin: bigint;
  largestLoss: bigint;
}

const GAME_HOUSE_ABI = parseAbi([
  "function getPlayerStats(address player) external view returns ((address playerAddress, uint256 totalGames, uint256 totalWins, uint256 totalLosses, int256 totalProfit, uint256 lastGameTime, uint256 largestWin, uint256 largestLoss))",
]);

export const PlayerStats: React.FC<PlayerStatsProps> = ({ contractAddress, refreshTrigger = 0 }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  const resolvedAddress = (contractAddress || process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS || "") as `0x${string}`;

  useEffect(() => {
    if (!isConnected || !address || !publicClient || !resolvedAddress) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const playerStats = (await publicClient.readContract({
          address: resolvedAddress,
          abi: GAME_HOUSE_ABI,
          functionName: "getPlayerStats",
          args: [address],
        })) as PlayerStats;

        setStats(playerStats);
      } catch (err: any) {
        // Player not found is normal (not played yet)
        if (err.message.includes("Player not found")) {
          setStats(null);
        } else {
          console.error(err);
        }
      }
      setLoading(false);
    };

    fetchStats();
  }, [isConnected, address, publicClient, resolvedAddress, refreshTrigger]);

  if (!isConnected) {
    return (
      <div className="bg-casino-dark border border-casino-purple/30 rounded-lg p-6 text-center text-gray-400">
        Connect wallet to view your stats
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-3">👤 No statistics yet</p>
        <p className="text-sm text-gray-500">Play some games to see your stats here!</p>
      </div>
    );
  }

  const formatEth = (wei: bigint) => {
    // viem supports signed bigint formatting for int256 values
    const eth = Number.parseFloat(formatEther(wei));
    if (!Number.isFinite(eth)) return "0.000000";
    return eth.toFixed(6);
  };

  const winRate = Number(stats.totalGames) > 0 
    ? ((Number(stats.totalWins) / Number(stats.totalGames)) * 100).toFixed(1)
    : "0.0";

  const isPositive = stats.totalProfit > 0n;
  const averageProfitWei = stats.totalGames > 0n ? stats.totalProfit / stats.totalGames : 0n;

  const lastGameDate = new Date(Number(stats.lastGameTime) * 1000);
  const timeAgo = Math.floor((Date.now() - lastGameDate.getTime()) / 1000);
  let timeString = "Never";
  if (timeAgo < 60) timeString = "Just now";
  else if (timeAgo < 3600) timeString = `${Math.floor(timeAgo / 60)}m ago`;
  else if (timeAgo < 86400) timeString = `${Math.floor(timeAgo / 3600)}h ago`;
  else timeString = `${Math.floor(timeAgo / 86400)}d ago`;

  return (
    <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Your Statistics</h3>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Total Games */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-gray-400 text-sm mb-1">🎮 Total Games</p>
          <p className="text-2xl font-bold text-white">
            {Number(stats.totalGames)}
          </p>
        </div>

        {/* Wins */}
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
          <p className="text-gray-400 text-sm mb-1">✅ Wins</p>
          <p className="text-2xl font-bold text-green-400">
            {Number(stats.totalWins)}
          </p>
        </div>

        {/* Losses */}
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
          <p className="text-gray-400 text-sm mb-1">❌ Losses</p>
          <p className="text-2xl font-bold text-red-400">
            {Number(stats.totalLosses)}
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-gray-400 text-sm mb-1">📈 Win Rate</p>
          <p className="text-2xl font-bold text-casino-gold">
            {winRate}%
          </p>
        </div>

        {/* Total Profit */}
        <div className={`rounded-lg p-4 border ${
          isPositive
            ? "bg-green-900/20 border-green-700/30"
            : "bg-red-900/20 border-red-700/30"
        }`}>
          <p className="text-gray-400 text-sm mb-1">💰 Total Profit</p>
          <p className={`text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{formatEth(stats.totalProfit)} ETH
          </p>
        </div>

        {/* Largest Win */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-gray-400 text-sm mb-1">🏆 Largest Win</p>
          <p className="text-2xl font-bold text-casino-gold">
            {formatEth(stats.largestWin)} ETH
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="border-t border-casino-purple/30 pt-4 space-y-2 text-sm">
        <div className="flex justify-between items-center text-gray-400">
          <span>Largest Loss</span>
          <span className="text-red-400 font-semibold">
            {formatEth(stats.largestLoss)} ETH
          </span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
          <span>Average Profit/Game</span>
          <span className={`font-semibold ${
            averageProfitWei > 0n
              ? "text-green-400"
              : "text-red-400"
          }`}>
            {formatEth(averageProfitWei)} ETH
          </span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
          <span>Last Game</span>
          <span className="text-gray-300">{timeString}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {Number(stats.totalGames) > 0 && (
        <div className="mt-4 pt-4 border-t border-casino-purple/30">
          <p className="text-xs text-gray-400 mb-2">Win Distribution</p>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              style={{
                width: `${(Number(stats.totalWins) / Number(stats.totalGames)) * 100}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Wins: {Number(stats.totalWins)}</span>
            <span>Losses: {Number(stats.totalLosses)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
