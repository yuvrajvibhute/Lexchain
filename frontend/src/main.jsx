import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, optimism } from "wagmi/chains";
import { connectorsForWallets, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  trustWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import "@rainbow-me/rainbowkit/styles.css";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

// ─── RainbowKit + Wagmi setup ─────────────────────────────────────────────────
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, coinbaseWallet, rainbowWallet, trustWallet],
    },
    {
      groupName: "More",
      wallets: [walletConnectWallet, injectedWallet],
    },
  ],
  { appName: "LexChain", projectId }
);

const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
  },
});

const queryClient = new QueryClient();

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#020818", display: "flex",
          alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif",
          flexDirection: "column", gap: 16, padding: 32,
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ color: "#f0c040", fontSize: 22, fontWeight: 800, margin: 0 }}>
            Startup Error
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", maxWidth: 480, lineHeight: 1.7 }}>
            Something went wrong while starting the app.
          </p>
          <details style={{ color: "#475569", fontSize: 11, maxWidth: 520 }}>
            <summary style={{ cursor: "pointer", color: "#64748b" }}>Error details</summary>
            <pre style={{ color: "#ef4444", marginTop: 8, fontSize: 11, whiteSpace: "pre-wrap" }}>
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Root ─────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#d4a017",
              accentColorForeground: "#020818",
              borderRadius: "medium",
              fontStack: "system",
              overlayBlur: "small",
            })}
            appInfo={{ appName: "LexChain — Blockchain Evidence Platform" }}
          >
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>
);
