import React from "react";

export const DashboardFooter: React.FC = () => {
  return (
    <div className="mt-12 pt-8 border-t border-casino-purple/30">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
  );
};