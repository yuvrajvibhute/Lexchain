/**
 * StellarWalletContext.jsx — Global Freighter wallet state for LexChain
 *
 * Provides:
 *   useStellarWallet() hook with:
 *     - publicKey         : string | null
 *     - isConnected       : boolean
 *     - isConnecting      : boolean
 *     - connectionError   : string | null
 *     - connect()         : async () => void
 *     - disconnect()      : () => void
 *     - network           : string  ("TESTNET" | unknown)
 *
 * Persists the public key in sessionStorage so a page refresh
 * doesn't force the user to reconnect within the same session.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import freighterApi from '@stellar/freighter-api';

const { isConnected, getPublicKey, requestAccess, getNetworkDetails } = freighterApi;

// ─── Context ──────────────────────────────────────────────────────────────────
const StellarWalletContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function StellarWalletProvider({ children }) {
    const [publicKey, setPublicKey]           = useState(null);
    const [isConnecting, setIsConnecting]     = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [network, setNetwork]               = useState(null);

    // ── On mount: restore from session if Freighter still has access ─────────
    useEffect(() => {
        (async () => {
            const cached = sessionStorage.getItem('lx_stellar_pk');
            if (!cached) return;

            try {
                const connResult = await isConnected();
                const connected  = typeof connResult === 'boolean'
                    ? connResult
                    : connResult?.isConnected ?? false;

                if (!connected) { sessionStorage.removeItem('lx_stellar_pk'); return; }

                const pkResult = await getPublicKey();
                const pk       = typeof pkResult === 'string' ? pkResult : pkResult?.publicKey;

                if (pk === cached) {
                    setPublicKey(pk);
                    await refreshNetwork();
                } else {
                    sessionStorage.removeItem('lx_stellar_pk');
                }
            } catch {
                sessionStorage.removeItem('lx_stellar_pk');
            }
        })();
    }, []);

    // ── Fetch network name from Freighter ────────────────────────────────────
    async function refreshNetwork() {
        try {
            const details = await getNetworkDetails();
            setNetwork(details?.network ?? details?.networkPassphrase ?? 'TESTNET');
        } catch {
            setNetwork('TESTNET');
        }
    }

    // ── connect() — prompts Freighter permission popup if needed ─────────────
    const connect = useCallback(async () => {
        setIsConnecting(true);
        setConnectionError(null);

        try {
            // Check extension is installed
            const connResult = await isConnected();
            const available  = typeof connResult === 'boolean'
                ? connResult
                : connResult?.isConnected ?? false;

            if (!available) {
                setConnectionError('Freighter wallet is not installed. Visit https://freighter.app to install it.');
                setIsConnecting(false);
                return;
            }

            // Request site permission (shows popup the first time)
            if (typeof requestAccess === 'function') {
                const access = await requestAccess();
                if (access?.error) {
                    setConnectionError(access.error);
                    setIsConnecting(false);
                    return;
                }
            }

            // Get public key
            const pkResult = await getPublicKey();
            const pk       = typeof pkResult === 'string' ? pkResult : pkResult?.publicKey;

            if (!pk) {
                setConnectionError('Freighter did not return a public key. Please unlock your wallet.');
                setIsConnecting(false);
                return;
            }

            setPublicKey(pk);
            sessionStorage.setItem('lx_stellar_pk', pk);
            await refreshNetwork();
        } catch (err) {
            setConnectionError(err.message ?? 'Unknown error connecting to Freighter.');
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // ── disconnect() — clear local state (Freighter has no "revoke" API) ─────
    const disconnect = useCallback(() => {
        setPublicKey(null);
        setNetwork(null);
        setConnectionError(null);
        sessionStorage.removeItem('lx_stellar_pk');
    }, []);

    const value = {
        publicKey,
        isConnected: !!publicKey,
        isConnecting,
        connectionError,
        network,
        connect,
        disconnect,
    };

    return (
        <StellarWalletContext.Provider value={value}>
            {children}
        </StellarWalletContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStellarWallet() {
    const ctx = useContext(StellarWalletContext);
    if (!ctx) throw new Error('useStellarWallet must be used inside <StellarWalletProvider>');
    return ctx;
}
