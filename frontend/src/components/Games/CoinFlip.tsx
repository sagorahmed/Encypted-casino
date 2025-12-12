import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog, encodeFunctionData, formatEther, parseAbi } from "viem";
import { getCasinoAddressByChainId } from "../../lib/wallet-config";

interface CoinFlipProps {
  contractAddress: string;
  onGameResult?: (won: boolean) => void;
  onBalanceUpdate?: (newBalanceEth?: string) => void;
}

export const CoinFlip: React.FC<CoinFlipProps> = ({ onGameResult, onBalanceUpdate }) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [betAmount, setBetAmount] = useState("0.0001");
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; payout: string } | null>(null);
  const [message, setMessage] = useState("");

  // Contract ABI for coin flip (simplified version)
  const COIN_FLIP_ABI = parseAbi([
    "function playCoinFlip(bytes emptyProof, bytes emptyProof2, uint256 betAmount, uint32 plaintextChoice) external returns (bool)",
    "event GamePlayed(address indexed player, uint8 gameType, uint256 betAmount, bool won)",
    "event BalanceDebug(address indexed player, uint8 gameType, uint256 beforePlain, uint256 afterPlain)",
    "function getUserGameHistoryLength(address user) view returns (uint256)",
    // viem parseAbi expects nested tuple return wrapped in parentheses; omit field names for compatibility
    "function getUserGameResult(address user, uint256 userGameIndex) view returns ((address,uint8,uint256,bool,uint256,bytes32))",
    "function getDecryptedBalance(address player) view returns (uint64)",
  ]);

  const handlePlay = async () => {
    if (!walletClient || !betAmount) {
      setMessage("Please select a bet amount");
      return;
    }

    setIsPlaying(true);
    setMessage("Playing...");
    setResult(null);

    try {
      // Send dummy encrypted values and proof (contract handles on-chain)
      const dummyEncrypted = "0x";
      
      const data = encodeFunctionData({
        abi: COIN_FLIP_ABI,
        functionName: "playCoinFlip",
        args: [
          dummyEncrypted,
          dummyEncrypted,
          BigInt(Math.floor(parseFloat(betAmount) * 1e18)),
          choice === "heads" ? 0 : 1,
        ],
      });

      const dynamicAddress = getCasinoAddressByChainId() as `0x${string}`;
      setMessage("🧾 Sending bet to blockchain...");
      const account = (await walletClient.getAddresses())[0] as `0x${string}`;
      // Estimate gas and clamp to network cap to avoid provider cap errors
      const gasEstimate = await publicClient!.estimateGas({
        account,
        to: dynamicAddress,
        data,
        value: 0n,
      });
      const gas = gasEstimate > 15_000_000n ? 15_000_000n : gasEstimate;

      const txHash = await walletClient.sendTransaction({
        to: dynamicAddress,
        data,
        gas,
      });
      setMessage("🧾 Tx sent: " + txHash + " — awaiting receipt...");

      // Wait for receipt
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setMessage("❌ Transaction reverted. No game result recorded.");
        return;
      }

      // If user has revealed their balance, we can update it from the same signed tx via BalanceDebug.
      try {
        const player = account.toLowerCase();
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: COIN_FLIP_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "BalanceDebug") {
              const args = decoded.args as any;
              if (String(args.player).toLowerCase() === player) {
                const afterWei = BigInt(args.afterPlain);
                onBalanceUpdate?.(Number.parseFloat(formatEther(afterWei)).toFixed(6));
                break;
              }
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      
      // Always read the latest game result directly from contract (don't rely on logs)
      let won = false;
      try {
        const account = await walletClient.getAddresses();
        const user = account[0] as `0x${string}`;
        const contractAddress = getCasinoAddressByChainId() as `0x${string}`;
        const userCount = await publicClient!.readContract({
          abi: COIN_FLIP_ABI,
          address: contractAddress,
          functionName: "getUserGameHistoryLength",
          args: [user],
        });
        if (typeof userCount === "bigint" && userCount > 0n) {
          const lastIndex = userCount - 1n;
          const lastGame = await publicClient!.readContract({
            abi: COIN_FLIP_ABI,
            address: contractAddress,
            functionName: "getUserGameResult",
            args: [user, lastIndex],
          }) as any;
          won = Boolean(lastGame[3]); // won is 4th element (index 3) in the tuple
        }
      } catch (err) {
        console.error('Error reading game result:', err);
      }

      // Update UI & request balance refresh via callback
      onGameResult?.(won);
      onBalanceUpdate?.();
      setMessage(won ? "🎉 You won! Balance will update." : "❌ You lost. Better luck next time.");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      console.error("Game error:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-casino-dark border border-casino-purple/30 rounded-lg p-8 text-center text-gray-400">
        Connect your wallet to play
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-casino-dark via-slate-900 to-casino-dark border border-casino-purple/30 rounded-lg p-8">
      <h2 className="text-3xl font-bold text-white mb-2">Coin Flip</h2>
      <p className="text-gray-400 mb-6">Guess heads or tails. Win 2x your bet!</p>

      <div className="space-y-6">
        {/* Choice Selection */}
        <div>
          <label className="block text-sm text-gray-400 mb-3">Select your choice:</label>
          <div className="flex gap-4">
            <button
              onClick={() => setChoice("heads")}
              disabled={isPlaying}
              className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                choice === "heads"
                  ? "bg-casino-purple text-white shadow-lg shadow-casino-purple/50"
                  : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
              } disabled:opacity-50`}
            >
              👤 Heads
            </button>
            <button
              onClick={() => setChoice("tails")}
              disabled={isPlaying}
              className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                choice === "tails"
                  ? "bg-casino-purple text-white shadow-lg shadow-casino-purple/50"
                  : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
              } disabled:opacity-50`}
            >
              🪙 Tails
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Bet Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.0001"
              max="0.0001"
              disabled={isPlaying}
              className="flex-1 bg-slate-700/50 border border-casino-purple/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-casino-purple disabled:opacity-50"
            />
            <button
              onClick={() => setBetAmount("0.0001")}
              className="bg-casino-gold/20 text-casino-gold px-4 py-2 rounded hover:bg-casino-gold/30 transition-colors"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Max bet: 0.0001 ETH</p>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`w-full bg-gradient-to-r from-casino-purple to-casino-gold text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-casino-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${result ? 'animate-coin-flip' : ''}`}
        >
          {isPlaying ? "Playing..." : "Play Game"}
        </button>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-lg text-center font-semibold animate-result-pop ${
              result.won
                ? "bg-green-500/20 border border-green-500/50 text-green-400"
                : "bg-red-500/20 border border-red-500/50 text-red-400"
            }`}
          >
            {result.won ? (
              <div>
                <p className="text-lg">🎉 You Won!</p>
                <p className="text-sm mt-1">Payout: {result.payout} ETH</p>
              </div>
            ) : (
              <p className="text-lg">❌ You Lost</p>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
