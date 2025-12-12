import React, { useEffect } from "react";
import { useAccount, useBalance } from "wagmi";

interface WalletConnectionProps {
  onConnected?: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  onConnected,
}) => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  useEffect(() => {
    if (isConnected && onConnected) {
      onConnected();
    }
  }, [isConnected, onConnected]);

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <div className="flex items-center gap-4 bg-casino-purple/20 px-4 py-2 rounded-lg">
          <div className="text-sm">
            <p className="text-gray-400">Connected Wallet</p>
            <p className="font-mono text-white">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          {balance && (
            <div className="text-sm">
              <p className="text-gray-400">Balance</p>
              <p className="font-mono text-casino-gold">
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-400">Wallet not connected</p>
      )}
    </div>
  );
};
