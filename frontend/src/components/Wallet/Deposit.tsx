import React, { useState } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId } from "wagmi";
import { ethers } from "ethers";
import { encodeFunctionData, parseAbi } from "viem";
import { getCasinoAddressByChainId } from "../../lib/wallet-config";

interface DepositWithdrawProps {
  onSuccess?: () => void;
  onWithdraw?: () => void;
  onBalanceUpdate?: (newBalanceEth?: string) => void;
}

// GameHouse ABI - deposit/withdraw + simple view for preflight
const GAME_HOUSE_ABI = parseAbi([
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getContractBalance() external view returns (uint256)",
]);

export const DepositWithdraw: React.FC<DepositWithdrawProps> = ({ onSuccess, onWithdraw, onBalanceUpdate }) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  const STORAGE_KEY_REVEALED_BALANCE = "casino.revealedBalanceEth";

  const bumpRevealedBalance = (deltaEth: number) => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem(STORAGE_KEY_REVEALED_BALANCE);
      if (!stored) return;
      const current = Number.parseFloat(stored);
      if (!Number.isFinite(current)) return;
      const next = (current + deltaEth).toFixed(6);
      window.localStorage.setItem(STORAGE_KEY_REVEALED_BALANCE, next);
      onBalanceUpdate?.(next);
    } catch {
      // ignore
    }
  };

  const handleDeposit = async () => {
    if (!walletClient || !amount) {
      setMessage("Please enter an amount");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setTxHash(null);

    try {
      const amountWei = BigInt(ethers.parseEther(amount.trim()));
      if (amountWei <= 0n) {
        setMessage("Enter an amount greater than 0");
        return;
      }
      console.log("Deposit amount input:", amount, "Parsed wei:", amountWei.toString());
      
      // Encode the deposit() function call
      const data = encodeFunctionData({
        abi: GAME_HOUSE_ABI,
        functionName: "deposit",
      });

      const contractAddress = getCasinoAddressByChainId() as `0x${string}` | undefined;
      if (!contractAddress) {
        throw new Error(
          `Missing contract address. Set NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS in env.`
        );
      }
      // Preflight: ensure target has bytecode; simulate to catch reverts
      const bytecode = await publicClient!.getBytecode({ address: contractAddress });
            // Optional preflight: can we read a known view from this address?
            try {
              await publicClient!.readContract({
                address: contractAddress,
                abi: GAME_HOUSE_ABI,
                functionName: "getContractBalance",
              });
            } catch (err) {
              throw new Error(
                `Address ${contractAddress} does not match GameHouse ABI (contractBalance read failed).`
              );
            }
      if (!bytecode) {
        throw new Error(
          `Contract not found at ${contractAddress} on chain ${chainId}. Check env address and wallet network.`
        );
      }
      // Simulate contract call with ABI to detect reverts with better context
      try {
        console.log("Simulating deposit with:", { contractAddress, amountWei: amountWei.toString(), account: address });
        await publicClient!.simulateContract({
          address: contractAddress,
          abi: GAME_HOUSE_ABI,
          functionName: "deposit",
          account: address as `0x${string}`,
          value: amountWei,
        });
        console.log("✅ Simulation passed");
      } catch (err: any) {
        console.error("❌ Simulation failed:", err);
        const reason = err?.shortMessage || err?.details || err?.message || "Simulation failed";
        throw new Error(`Deposit would revert: ${reason}. Please check the browser console for more details.`);
      }
      // Always estimate gas and fees; avoid sending without explicit gas
      const estimatedGas = await publicClient!.estimateGas({
        account: address as `0x${string}`,
        to: contractAddress,
        value: amountWei,
        data,
      });
      const buffered = estimatedGas ? (estimatedGas * 12n) / 10n : 300000n; // +20%
      const gasCap = 1_200_000n; // tighter cap to avoid RPC hard caps
      const gas = buffered > gasCap ? gasCap : buffered;

      const fees = await publicClient!.estimateFeesPerGas();
      const txHash = await walletClient.sendTransaction({
        to: contractAddress,
        value: amountWei,
        data,
        gas,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      setTxHash(txHash);
      setMessage("🧾 Deposit tx sent — awaiting confirmation...");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setMessage("❌ Deposit reverted");
        return;
      }
      bumpRevealedBalance(Number(amountWei) / 1e18);
      setMessage("✅ Deposit confirmed!");
      setAmount("");
      // Refresh balance after deposit
      setTimeout(() => onSuccess?.(), 2000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !amount) {
      setMessage("Please enter an amount");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setTxHash(null);

    try {
      const amountWei = BigInt(ethers.parseEther(amount));
      
      // Encode the withdraw(uint256) function call
      const data = encodeFunctionData({
        abi: GAME_HOUSE_ABI,
        functionName: "withdraw",
        args: [amountWei],
      });

      const dynamicAddress = getCasinoAddressByChainId() as `0x${string}` | undefined;
      if (!dynamicAddress) {
        throw new Error(
          `Missing contract address. Set NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS in env.`
        );
      }
      const bytecode2 = await publicClient!.getBytecode({ address: dynamicAddress });
      if (!bytecode2) {
        throw new Error(
          `Contract not found at ${dynamicAddress} on chain ${chainId}. Check env address and wallet network.`
        );
      }
      // Simulate withdraw to detect reverts
      try {
        await publicClient!.simulateContract({
          address: dynamicAddress,
          abi: GAME_HOUSE_ABI,
          functionName: "withdraw",
          account: address as `0x${string}`,
          args: [amountWei],
        });
      } catch (err: any) {
        const reason = err?.shortMessage || err?.details || err?.message || "Simulation failed";
        throw new Error(`Withdraw would revert: ${reason}`);
      }
      const estimatedGas = await publicClient!.estimateGas({
        account: address as `0x${string}`,
        to: dynamicAddress,
        data,
      });
      const buffered = estimatedGas ? (estimatedGas * 12n) / 10n : 300000n;
      const gasCap = 1_200_000n;
      const gas = buffered > gasCap ? gasCap : buffered;
      const fees = await publicClient!.estimateFeesPerGas();
      const txHash = await walletClient.sendTransaction({
        to: dynamicAddress,
        data,
        gas,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      setTxHash(txHash);
      setMessage("🧾 Withdrawal tx sent — awaiting confirmation...");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setMessage("❌ Withdrawal reverted");
        return;
      }
      bumpRevealedBalance(-(Number(amountWei) / 1e18));
      setMessage("✅ Withdrawal confirmed!");
      setAmount("");
      // Trigger balance refresh
      onWithdraw?.();
      // Refresh balance after withdrawal
      setTimeout(() => onSuccess?.(), 2000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-casino-dark border border-casino-purple/30 rounded-lg p-6 text-center text-gray-400">
        Please connect your wallet
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-casino-dark to-slate-900 border border-casino-purple/30 rounded-lg p-6">
      <div className="text-xs text-gray-400 mb-2">
        Using contract: {process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS} on Sepolia
      </div>
      <div className="text-xs text-gray-500 mb-4">
        Chain ID: {chainId}
      </div>
      <div className="flex gap-2 mb-6 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex-1 py-2 rounded transition-colors ${
            activeTab === "deposit"
              ? "bg-casino-purple text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`flex-1 py-2 rounded transition-colors ${
            activeTab === "withdraw"
              ? "bg-casino-purple text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Withdraw
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (ETH)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
              placeholder="0.001"
              step="0.0001"
            min="0"
            className="w-full bg-slate-700/50 border border-casino-purple/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-casino-purple"
            disabled={isLoading}
          />
            <p className="text-xs text-gray-500 mt-1">{activeTab === "deposit" ? "Enter amount to deposit" : "Enter amount to withdraw"}</p>
            {amount && (
              <p className="text-[10px] text-gray-500 mt-1">Parsed wei: {(() => {
                try { return String(BigInt(ethers.parseEther(amount.trim()))); } catch { return "invalid"; }
              })()}</p>
            )}
        </div>

        <button
          onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
          className="w-full bg-gradient-to-r from-casino-purple to-casino-gold text-white font-semibold py-2 rounded-lg hover:shadow-lg hover:shadow-casino-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Processing..." : activeTab === "deposit" ? "Deposit" : "Withdraw"}
        </button>

        {message && (
          <div className="mt-3 rounded-md border border-green-300 bg-green-50 p-3 text-xs text-green-700 break-all">
            <div className="font-medium">{message}</div>
            {txHash && <div className="opacity-80">Hash: {txHash}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
