/**
 * Wallet context — uses RainbowKit + wagmi for wallet connection.
 * Provides the same interface surface as Privy so Login/Register
 * components work unchanged.
 */
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export const isPrivyEnabled = false; // Using RainbowKit instead

/**
 * Drop-in replacement for usePrivy() — powered by RainbowKit + wagmi.
 * Returns: { login, logout, authenticated, user }
 */
export function usePrivySafe() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  return {
    login: openConnectModal ?? (() => {}),
    logout: disconnect,
    authenticated: isConnected,
    user: isConnected ? { wallet: { address } } : null,
    ready: true,
  };
}
