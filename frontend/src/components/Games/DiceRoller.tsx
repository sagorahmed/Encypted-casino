import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog, encodeFunctionData, formatEther, parseAbi } from "viem";
import { getCasinoAddressByChainId } from "../../lib/wallet-config";

interface DiceRollerProps {
  contractAddress: string;
  onGameResult?: (won: boolean) => void;
  onBalanceUpdate?: (newBalanceEth?: string) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ onGameResult, onBalanceUpdate }) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [betAmount, setBetAmount] = useState("0.0001");
  const [choice, setChoice] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; payout: string } | null>(null);
  const [message, setMessage] = useState("");

  const DICE_ABI = parseAbi([
    "function playDiceRoller(bytes emptyProof, bytes emptyProof2, uint256 betAmount, uint32 plaintextChoice) external returns (bool)",
    "event GamePlayed(address indexed player, uint8 gameType, uint256 betAmount, bool won)",
    "event BalanceDebug(address indexed player, uint8 gameType, uint256 beforePlain, uint256 afterPlain)",
    "function getUserGameHistoryLength(address user) view returns (uint256)",
    "function getUserGameResult(address user, uint256 userGameIndex) view returns ((address,uint8,uint256,bool,uint256,bytes32))",
    "function getDecryptedBalance(address player) view returns (uint64)",
  ]);

  const handlePlay = async () => {
    if (!walletClient || !betAmount) {
      setMessage("Please select a bet amount");
      return;
    }

    setIsPlaying(true);
    setMessage("Rolling dice...");
    setResult(null);

    try {
      // Send dummy encrypted values
      const dummyEncrypted = "0x";

      const data = encodeFunctionData({
        abi: DICE_ABI,
        functionName: "playDiceRoller",
        args: [
          dummyEncrypted,
          dummyEncrypted,
          BigInt(Math.floor(parseFloat(betAmount) * 1e18)),
          choice,
        ],
      });

      const dynamicAddress = getCasinoAddressByChainId() as `0x${string}`;
      setMessage("🧾 Sending encrypted bet to blockchain...");
      const account = (await walletClient.getAddresses())[0] as `0x${string}`;
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

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setMessage("❌ Transaction reverted. No game result recorded.");
        return;
      }

      // Update revealed balance from receipt (no extra reads)
      try {
        const player = account.toLowerCase();
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: DICE_ABI,
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
          abi: DICE_ABI,
          address: contractAddress,
          functionName: "getUserGameHistoryLength",
          args: [user],
        });
        if (typeof userCount === "bigint" && userCount > 0n) {
          const lastIndex = userCount - 1n;
          const lastGame = await publicClient!.readContract({
            abi: DICE_ABI,
            address: contractAddress,
            functionName: "getUserGameResult",
            args: [user, lastIndex],
          }) as any;
          won = Boolean(lastGame[3]); // won is 4th element (index 3) in the tuple
        }
      } catch (err) {
        console.error('Error reading game result:', err);
      }

      onGameResult?.(won);
      onBalanceUpdate?.();
      setMessage(won ? "🎉 You won! 6x your bet! Balance will update." : "❌ Dice didn't match. Try again!");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      console.error("Dice game error:", error);
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
      <h2 className="text-3xl font-bold text-white mb-2">🎲 Dice Roller</h2>
      <p className="text-gray-400 mb-6">Pick a number 1-6. Win 6x your bet!</p>

      <div className="space-y-6">
        {/* Dice Selection */}
        <div>
          <label className="block text-sm text-gray-400 mb-3">Pick your lucky number:</label>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setChoice(num)}
                className={`py-3 rounded-lg font-bold text-lg transition-all ${
                  choice === num
                    ? "bg-casino-gold text-black border-2 border-casino-gold"
                    : "bg-slate-700 text-white border-2 border-slate-600 hover:border-casino-gold"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Bet Amount (ETH):</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            max="0.0001"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-casino-gold focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Max bet: 0.0001 ETH</p>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={isPlaying || !isConnected}
          className="w-full bg-gradient-to-r from-casino-purple to-casino-gold hover:shadow-lg hover:shadow-casino-gold/50 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all text-lg"
        >
          {isPlaying ? "🎲 Rolling..." : "🎲 Roll Dice"}
        </button>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg text-center text-sm ${
            message.includes("🎉")
              ? "bg-green-900/30 text-green-300"
              : message.includes("❌")
              ? "bg-red-900/30 text-red-300"
              : "bg-blue-900/30 text-blue-300"
          }`}>
            {message}
          </div>
        )}

        {/* Game Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-casino-purple/30">
          <div className="text-center">
            <p className="text-casino-gold text-sm font-semibold mb-1">Win Rate</p>
            <p className="text-white text-lg">16.67%</p>
          </div>
          <div className="text-center">
            <p className="text-casino-gold text-sm font-semibold mb-1">Payout</p>
            <p className="text-white text-lg">6x Bet</p>
          </div>
        </div>
      </div>
    </div>
  );
};
