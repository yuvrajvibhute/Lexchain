/**
 * Wallet context — uses Privy for wallet connection and authentication.
 */
import { usePrivy } from "@privy-io/react-auth";

export const isPrivyEnabled = true;

/**
 * Drop-in replacement for usePrivy() — powered by Privy.
 * Returns: { login, logout, authenticated, user, ready }
 */
export function usePrivySafe() {
  const { login, logout, authenticated, user, ready, connectWallet } = usePrivy();

  return {
    login,
    logout,
    authenticated,
    user,
    ready,
    connectWallet,
  };
}

