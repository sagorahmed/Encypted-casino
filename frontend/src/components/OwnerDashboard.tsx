import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { encodeFunctionData, parseAbi } from "viem";

interface OwnerDashboardProps {
  contractAddress: string;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ contractAddress }) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  const [houseFunds, setHouseFunds] = useState("0");
  const [totalBalance, setTotalBalance] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [houseEdge, setHouseEdge] = useState<number | null>(null);

  const resolvedAddress = (contractAddress || process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS || "") as `0x${string}`;

  useEffect(() => {
    const fetchOwner = async () => {
      if (!publicClient || !resolvedAddress) return;
      try {
        const OWNER_ABI = parseAbi(["function owner() view returns (address)"]);
        const owner = await publicClient.readContract({
          abi: OWNER_ABI,
          address: resolvedAddress,
          functionName: "owner",
        });
        setOwnerAddress(String(owner));
      } catch {
        setOwnerAddress(null);
      }
    };
    fetchOwner();
  }, [publicClient, resolvedAddress]);

  const fetchBalances = async () => {
    if (!publicClient) return;
    try {
      setLoading(true);
      setMessage("Fetching balances...");

      if (!resolvedAddress) {
        setMessage("❌ Missing contract address. Set NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS.");
        return;
      }

      const bytecode = await publicClient.getBytecode({ address: resolvedAddress });
      if (!bytecode) {
        setMessage("❌ No contract found at provided address. Check NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS and network.");
        return;
      }

      // GameHouse exposes `getHouseFunds()` onlyOwner, but `houseFunds()` is public.
      const HOUSE_ABI = parseAbi(["function houseFunds() view returns (uint256)"]);
      const house = await publicClient.readContract({
        abi: HOUSE_ABI,
        address: resolvedAddress,
        functionName: "houseFunds",
      });
      setHouseFunds((Number(house) / 1e18).toFixed(4));

      const contractBal = await publicClient.getBalance({ address: resolvedAddress });
      setTotalBalance((Number(contractBal) / 1e18).toFixed(4));

      const STATS_ABI = parseAbi([
        "function getTotalPlayers() view returns (uint256)",
        "function getGameHistoryLength() view returns (uint256)",
      ]);
      try {
        const players = await publicClient.readContract({
          abi: STATS_ABI,
          address: resolvedAddress,
          functionName: "getTotalPlayers",
        });
        setTotalPlayers(Number(players));
      } catch {}
      try {
        const games = await publicClient.readContract({
          abi: STATS_ABI,
          address: resolvedAddress,
          functionName: "getGameHistoryLength",
        });
        setTotalGames(Number(games));
      } catch {}
      setHouseEdge(null);

      setMessage("");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseDeposit = async () => {
    if (!walletClient || !publicClient || !depositAmount) { setMessage("Please enter amount to deposit"); return; }
    setLoading(true); setMessage("Depositing to house...");
    try {
      const amountWei = BigInt(Math.floor(parseFloat(depositAmount) * 1e18));
      const HOUSE_ABI = parseAbi(["function depositHouseFunds() payable"]);
      const data = encodeFunctionData({ abi: HOUSE_ABI, functionName: "depositHouseFunds" });
      const txHash = await walletClient.sendTransaction({ to: resolvedAddress, value: amountWei, data });
      setMessage("🧾 Tx sent: " + txHash + " — awaiting receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setMessage("❌ House deposit reverted");
        return;
      }
      setMessage("✅ House deposit successful!");
      setDepositAmount("");
      fetchBalances();
    } catch (error: any) { setMessage(`❌ Error: ${error.message}`); } finally { setLoading(false); }
  };

  const handleHouseWithdraw = async () => {
    if (!walletClient || !publicClient || !withdrawAmount) { setMessage("Please enter amount to withdraw"); return; }
    setLoading(true); setMessage("Withdrawing from house...");
    try {
      const amountWei = BigInt(Math.floor(parseFloat(withdrawAmount) * 1e18));
      const HOUSE_ABI = parseAbi(["function withdrawHouseFunds(uint256 amount)"]);
      const data = encodeFunctionData({ abi: HOUSE_ABI, functionName: "withdrawHouseFunds", args: [amountWei] });
      const txHash = await walletClient.sendTransaction({ to: resolvedAddress, data });
      setMessage("🧾 Tx sent: " + txHash + " — awaiting receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setMessage("❌ House withdrawal reverted");
        return;
      }
      setMessage("✅ House withdrawal successful!");
      setWithdrawAmount("");
      fetchBalances();
    } catch (error: any) { setMessage(`❌ Error: ${error.message}`); } finally { setLoading(false); }
  };

  const isOwner =
    isConnected &&
    !!address &&
    (
      (!!ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase()) ||
      (!!process.env.NEXT_PUBLIC_OWNER_ADDRESS &&
        address.toLowerCase() === String(process.env.NEXT_PUBLIC_OWNER_ADDRESS).toLowerCase())
    );
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-casino-dark via-slate-900 to-casino-dark flex items-center justify-center">
        <div className="bg-casino-dark border border-casino-purple/30 rounded-lg p-8 text-center max-w-md">
          <p className="text-gray-300 text-lg">
            {!isConnected
              ? "Please connect your wallet"
              : "Only the owner can access this dashboard"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-dark via-slate-900 to-casino-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-casino-purple to-casino-gold mb-2">🏠 Owner Dashboard</h1>
          <p className="text-gray-400">Manage house funds and view casino statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border border-casino-purple/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">House Balance</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">House Funds (Non-Encrypted)</p>
                  <p className="text-2xl font-mono text-casino-gold">{houseFunds} ETH</p>
                </div>
                <div className="pt-3 border-t border-casino-purple/20">
                  <p className="text-gray-400 text-sm mb-1">Total Contract Balance (Encrypted)</p>
                  <p className="text-2xl font-mono text-white">{totalBalance} ETH</p>
                  <p className="text-xs text-gray-500 mt-1">🔒 FHE Encrypted</p>
                </div>
              </div>
            </div>
            <button onClick={fetchBalances} disabled={loading} className="w-full bg-casino-purple/30 border border-casino-purple/50 text-white py-2 rounded hover:bg-casino-purple/50 disabled:opacity-50 transition-colors">{loading ? "Loading..." : "Refresh Balances"}</button>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-casino-dark to-slate-900 border border-casino-purple/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deposit to House</h3>
              <div className="space-y-3">
                <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Amount in ETH" step="0.001" disabled={loading} className="w-full bg-slate-700/50 border border-casino-purple/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-casino-purple disabled:opacity-50" />
                <button onClick={handleHouseDeposit} disabled={loading || !depositAmount} className="w-full bg-gradient-to-r from-casino-purple to-casino-gold text-white font-semibold py-2 rounded hover:shadow-lg hover:shadow-casino-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{loading ? "Processing..." : "Deposit"}</button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-casino-dark to-slate-900 border border-casino-purple/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Withdraw from House</h3>
              <div className="space-y-3">
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount in ETH" step="0.001" disabled={loading} className="w-full bg-slate-700/50 border border-casino-purple/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-casino-purple disabled:opacity-50" />
                <button onClick={handleHouseWithdraw} disabled={loading || !withdrawAmount} className="w-full bg-gradient-to-r from-casino-gold to-casino-purple text-white font-semibold py-2 rounded hover:shadow-lg hover:shadow-casino-gold/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{loading ? "Processing..." : "Withdraw"}</button>
              </div>
            </div>
          </div>
        </div>

        {message && (<div className="mt-8 p-4 rounded-lg bg-slate-700/50 border border-slate-600 text-white">{message}</div>)}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-casino-purple/20 rounded-lg p-4 text-center"><p className="text-gray-400 text-sm mb-2">Total Players</p><p className="text-2xl font-bold text-casino-gold">{totalPlayers ?? "--"}</p></div>
          <div className="bg-slate-800/50 border border-casino-purple/20 rounded-lg p-4 text-center"><p className="text-gray-400 text-sm mb-2">Total Games Played</p><p className="text-2xl font-bold text-casino-gold">{totalGames ?? "--"}</p></div>
          <div className="bg-slate-800/50 border border-casino-purple/20 rounded-lg p-4 text-center"><p className="text-gray-400 text-sm mb-2">House Edge %</p><p className="text-2xl font-bold text-casino-gold">{houseEdge ?? "--"}%</p></div>
        </div>
      </div>
    </div>
  );
};