import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";

// RainbowKit config (Sepolia-only)
export const config = getDefaultConfig({
  appName: "Encrypted Casino",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "encrypted-casino",
  chains: [sepolia] as any,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL as string),
  } as any,
  ssr: true,
});

// Helpers: select contract address and RPC by chain id
export function getCasinoAddressByChainId(): `0x${string}` | undefined {
  return process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS as `0x${string}` | undefined;
}

export function getRpcUrlByChainId(): string | undefined {
  return process.env.NEXT_PUBLIC_RPC_URL;
}
