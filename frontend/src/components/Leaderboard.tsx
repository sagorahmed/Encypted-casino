import React, { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { parseAbi } from "viem";

interface LeaderboardProps {
  contractAddress?: string;
}

interface PlayerStat {
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
  "function getLeaderboard(uint256 count) external view returns ((address playerAddress, uint256 totalGames, uint256 totalWins, uint256 totalLosses, int256 totalProfit, uint256 lastGameTime, uint256 largestWin, uint256 largestLoss)[])",
]);

export const Leaderboard: React.FC<LeaderboardProps> = ({ contractAddress }) => {
  const publicClient = usePublicClient();
  const [leaderboard, setLeaderboard] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"profit" | "wins" | "games">("profit");

  const resolvedAddress = (contractAddress || process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS || "") as `0x${string}`;

  useEffect(() => {
    if (!publicClient || !resolvedAddress) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const leaders = (await publicClient.readContract({
          address: resolvedAddress,
          abi: GAME_HOUSE_ABI,
          functionName: "getLeaderboard",
          args: [10n],
        })) as PlayerStat[];

        setLeaderboard(leaders);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
      setLoading(false);
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [publicClient, resolvedAddress]);

  const formatAddress = (addr: string) => {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const formatEth = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  const getWinRate = (wins: bigint, games: bigint) => {
    if (games === 0n) return 0;
    return ((Number(wins) / Number(games)) * 100).toFixed(1);
  };

  return (
    <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🏆 Leaderboard
        </h2>
        {loading && (
          <div className="animate-spin h-5 w-5 border-2 border-casino-gold border-t-transparent rounded-full"></div>
        )}
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy("profit")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            sortBy === "profit"
              ? "bg-casino-gold text-black"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          💰 Profit
        </button>
        <button
          onClick={() => setSortBy("wins")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            sortBy === "wins"
              ? "bg-casino-gold text-black"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          ✅ Wins
        </button>
        <button
          onClick={() => setSortBy("games")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            sortBy === "games"
              ? "bg-casino-gold text-black"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          🎮 Games
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-casino-purple/30 text-gray-400">
              <th className="text-left py-3 px-2">Rank</th>
              <th className="text-left py-3 px-2">Player</th>
              <th className="text-right py-3 px-2">Games</th>
              <th className="text-right py-3 px-2">Win Rate</th>
              <th className="text-right py-3 px-2 text-casino-gold">Profit</th>
              <th className="text-right py-3 px-2">Largest Win</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No players yet. Start playing to appear on the leaderboard!
                </td>
              </tr>
            ) : (
              leaderboard.map((player, idx) => {
                const profit = Number(player.totalProfit);
                const isPositive = profit > 0;
                return (
                  <tr
                    key={player.playerAddress}
                    className="border-b border-casino-purple/20 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <span className="text-casino-gold font-bold">#{idx + 1}</span>
                    </td>
                    <td className="py-3 px-2 font-mono text-gray-300">
                      {formatAddress(player.playerAddress)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">
                      {Number(player.totalGames)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">
                      {getWinRate(player.totalWins, player.totalGames)}%
                    </td>
                    <td className={`py-3 px-2 text-right font-semibold ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}>
                      {isPositive ? "+" : ""}{formatEth(player.totalProfit)} ETH
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">
                      {formatEth(player.largestWin)} ETH
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Footer */}
      {leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-casino-purple/30 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-400 mb-1">Top Profit</p>
            <p className="text-casino-gold font-semibold">
              {formatEth(leaderboard[0].totalProfit)} ETH
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 mb-1">Avg Games/Player</p>
            <p className="text-white font-semibold">
              {(leaderboard.reduce((sum, p) => sum + Number(p.totalGames), 0) / leaderboard.length).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 mb-1">Total Volume</p>
            <p className="text-white font-semibold">
              {leaderboard.length} players
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
