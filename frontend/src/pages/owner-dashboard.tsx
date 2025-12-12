import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { OwnerDashboard } from "@/components/OwnerDashboard";

export default function OwnerPage() {
  const contractAddress = process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS || "";

  return (
    <div className="min-h-screen bg-casino-dark">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-casino-dark to-slate-900 border-b border-casino-purple/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-casino-purple to-casino-gold">
            🎰 Encrypted Casino
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="bg-gradient-to-r from-casino-gold to-casino-purple text-white font-semibold px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-casino-gold/50 transition-all text-sm"
            >
              Play
            </a>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <OwnerDashboard contractAddress={contractAddress} />
    </div>
  );
}
