import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { mainnet, polygon, optimism } from "wagmi/chains";
import { http } from "wagmi";
import { PrivyProvider } from "@privy-io/react-auth";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./App.css";
import "./index.css";


// ─── Privy config ─────────────────────────────────────────────────────────────
const PRIVY_APP_ID = "cmnif2ahs01am0clcp3zs15df";

const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism],
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
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: "dark",
            accentColor: "#d4a017",
            logo: "/logo.jpg",
          },
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
          externalWallets: {
            coinbaseWallet: { connectionOptions: "all" },
          },
          loginMethods: ["wallet", "email"],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
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
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorBoundary>
  </StrictMode>
);
