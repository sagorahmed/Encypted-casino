import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog, encodeFunctionData, parseAbi } from "viem";

interface BalanceDisplayProps {
  contractAddress?: string;
  refreshInterval?: number;
  refreshTrigger?: number;
  revealedBalanceHintEth?: string | null;
}

// GameHouse ABI - player encrypted and decrypted balances
const GAME_HOUSE_ABI = parseAbi([
  "function getContractBalance() external view returns (uint256)",
  "function getEncryptedBalance(address player) external view returns (bytes32)",
  "function requestBalanceReveal() external",
  "event BalanceRevealed(address indexed player, uint64 balance, uint256 timestamp)",
]);

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  contractAddress,
  refreshInterval = 2000,
  refreshTrigger = 0,
  revealedBalanceHintEth = null,
}) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [revealedBalance, setRevealedBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [revealTxHash, setRevealTxHash] = useState<string | null>(null);
  const resolvedAddress = (contractAddress || process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS || "") as `0x${string}`;

  const STORAGE_KEY_REVEALED_BALANCE = "casino.revealedBalanceEth";

  const fetchBalance = React.useCallback(async () => {
    if (!isConnected || !resolvedAddress || !address || !publicClient) return;

    setLoading(true);
    try {
      // Verify the contract exists
      const code = await publicClient.getBytecode({ address: resolvedAddress });
      if (!code || code === "0x") {
        throw new Error("Contract code not found at address. Check network & address.");
      }

      // Get contract balance
      const contractBal = await publicClient.readContract({
        address: resolvedAddress,
        abi: GAME_HOUSE_ABI,
        functionName: "getContractBalance",
      });
      const balanceInEth = Number(contractBal) / 1e18;
      setContractBalance(balanceInEth.toFixed(6));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setContractBalance("0");
      setRevealedBalance(null);
    }
    setLoading(false);
  }, [isConnected, address, resolvedAddress, publicClient]);

  // Fetch on mount (no automatic polling)
  useEffect(() => {
    // Restore last revealed balance after page refresh (explicit user action already happened)
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(STORAGE_KEY_REVEALED_BALANCE);
        if (stored) setRevealedBalance(stored);
      }
    } catch {
      // ignore storage errors
    }

    fetchBalance();
    return;
  }, [fetchBalance, refreshInterval]);

  // Force refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("🔄 Balance refresh triggered");
      fetchBalance();
    }
  }, [refreshTrigger, fetchBalance]);

  // If user has already revealed balance, allow in-app tx receipts to update it.
  useEffect(() => {
    if (revealedBalance === null) return;
    if (!revealedBalanceHintEth) return;
    setRevealedBalance(revealedBalanceHintEth);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY_REVEALED_BALANCE, revealedBalanceHintEth);
      }
    } catch {
      // ignore
    }
  }, [revealedBalanceHintEth, revealedBalance]);

  const handleRevealBalance = async () => {
    if (!address || !walletClient || !publicClient) {
      alert("Connect wallet first");
      return;
    }

    setRevealLoading(true);
    setStatusMessage("");
    setRevealTxHash(null);
    try {
      // Encode the function call
      const data = encodeFunctionData({
        abi: GAME_HOUSE_ABI,
        functionName: "requestBalanceReveal",
        args: [],
      });

      const txHash = await walletClient.sendTransaction({
        account: address,
        to: resolvedAddress,
        data,
      });

      setRevealTxHash(txHash);
      setStatusMessage("🧾 Tx sent — awaiting receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== "success") {
        setStatusMessage("❌ Reveal transaction reverted");
        return;
      }

      // Parse BalanceRevealed from logs
      let revealedWei: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: GAME_HOUSE_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "BalanceRevealed") {
            const args = decoded.args as any;
            if ((args.player as string)?.toLowerCase() === address.toLowerCase()) {
              revealedWei = BigInt(args.balance);
              break;
            }
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (revealedWei === null) {
        setStatusMessage("✅ Reveal confirmed, but event not found (RPC log decoding issue)");
        return;
      }

      const revealedInEth = Number(revealedWei) / 1e18;
      const formatted = revealedInEth.toFixed(6);
      setRevealedBalance(formatted);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY_REVEALED_BALANCE, formatted);
        }
      } catch {
        // ignore
      }
      setStatusMessage("✅ Balance revealed");
    } catch (error: any) {
      console.error("Error requesting decryption:", error);
      const errorMsg = error?.shortMessage || error?.message || "Unknown error";
      alert("❌ Error: " + errorMsg);
    } finally {
      setRevealLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-2">💰 Contract Balance</p>
          <p className="text-2xl font-bold text-white font-mono">
            {loading ? "..." : contractBalance} ETH
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-casino-gold border-t-transparent rounded-full"></div>
          )}
          <button
            onClick={() => fetchBalance()}
            disabled={loading}
            className="bg-slate-700/50 border border-slate-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      <hr className="border-casino-purple/20 my-4" />

      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-sm">
            {revealedBalance === null ? "🔒 Your Balance" : "✅ Your Balance"}
          </p>
          {revealedBalance === null && (
            <span className="text-xs bg-casino-purple/30 text-casino-purple px-2 py-1 rounded">
              HIDDEN
            </span>
          )}
        </div>
        
        <p className="text-2xl font-bold text-white font-mono mb-3">
          {revealedBalance === null ? "••••••" : revealedBalance} ETH
        </p>

        <div className="space-y-2">
          <button
            onClick={handleRevealBalance}
            disabled={revealLoading || !isConnected}
            className="w-full bg-gradient-to-r from-casino-gold to-casino-purple hover:shadow-lg hover:shadow-casino-gold/50 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
          >
            {revealLoading ? "🧾 Confirm in wallet..." : "🧾 Reveal Balance (tx)"}
          </button>
          <button
            onClick={() => {
              setRevealedBalance(null);
              setRevealTxHash(null);
              setStatusMessage("");
              try {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(STORAGE_KEY_REVEALED_BALANCE);
                }
              } catch {
                // ignore
              }
            }}
            disabled={revealLoading || revealedBalance === null}
            className="w-full bg-slate-700/50 border border-slate-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            Hide Balance
          </button>
          {statusMessage && (
            <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm">
              <div>{statusMessage}</div>
              {revealTxHash && (
                <div className="mt-2 text-xs text-gray-300 font-mono break-all">
                  Hash: {revealTxHash}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Balance is only shown after you sign a transaction.
          </p>
        </div>
      </div>
    </div>
  );
};
