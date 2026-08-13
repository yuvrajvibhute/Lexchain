/**
 * stellarWallet.js — LexChain Stellar Wallet Integration
 *
 * Provides helper functions for connecting to Freighter (Stellar browser wallet)
 * and querying the user's Stellar public key for display and identity purposes.
 *
 * Freighter is the primary Stellar wallet, analogous to MetaMask for EVM chains.
 * This utility wraps @stellar/freighter-api (v6) for use within React components.
 *
 * Usage:
 *   import { isFreighterAvailable, getStellarPublicKey, connectFreighterWallet } from './stellarWallet';
 */

import freighterApi from '@stellar/freighter-api';

const { isConnected, getPublicKey, signTransaction, requestAccess } = freighterApi;

const STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

/**
 * Check if Freighter extension is installed in the browser.
 * @returns {Promise<boolean>}
 */
export async function isFreighterAvailable() {
    try {
        const result = await isConnected();
        // v6 returns { isConnected: boolean } or just boolean depending on version
        if (typeof result === 'boolean') return result;
        return result?.isConnected ?? false;
    } catch {
        return false;
    }
}

/**
 * Request access to the user's Freighter wallet.
 * Prompts the user to grant site permission if not already granted.
 * @returns {Promise<{ publicKey: string|null, error: string|null }>}
 */
export async function connectFreighterWallet() {
    try {
        const available = await isFreighterAvailable();
        if (!available) {
            return {
                publicKey: null,
                error: 'Freighter wallet is not installed. Visit https://freighter.app to install.',
            };
        }

        // Request site access (prompts user if needed)
        if (typeof requestAccess === 'function') {
            const accessResult = await requestAccess();
            if (accessResult?.error) return { publicKey: null, error: accessResult.error };
        }

        const pkResult = await getPublicKey();
        // v6 returns { publicKey } or just the key string
        const publicKey = typeof pkResult === 'string' ? pkResult : pkResult?.publicKey;
        if (!publicKey) return { publicKey: null, error: 'Could not retrieve Stellar public key from Freighter.' };
        return { publicKey, error: null };
    } catch (err) {
        return { publicKey: null, error: err.message };
    }
}

/**
 * Get the connected Freighter wallet's Stellar public key (read-only, no popup).
 * Returns null if not connected or Freighter is not installed.
 * @returns {Promise<string|null>}
 */
export async function getStellarPublicKey() {
    try {
        const pkResult = await getPublicKey();
        return typeof pkResult === 'string' ? pkResult : (pkResult?.publicKey ?? null);
    } catch {
        return null;
    }
}

/**
 * Sign a Stellar XDR transaction with Freighter.
 * Used when submitting evidence anchoring transactions from the client.
 *
 * @param {string} xdr — Base64-encoded XDR transaction envelope
 * @returns {Promise<{ signedXdr: string|null, error: string|null }>}
 */
export async function signStellarXdr(xdr) {
    try {
        const result = await signTransaction(xdr, {
            networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        });
        if (result?.error) return { signedXdr: null, error: result.error };
        const signedXdr = result?.signedTxXdr ?? result;
        return { signedXdr: signedXdr || null, error: signedXdr ? null : 'Signing returned no XDR.' };
    } catch (err) {
        return { signedXdr: null, error: err.message };
    }
}

/**
 * Utility: shorten a Stellar public key for display
 * e.g. GCRA6G5...4CH52
 * @param {string} publicKey
 * @returns {string}
 */
export function shortenStellarKey(publicKey) {
    if (!publicKey || publicKey.length < 12) return publicKey;
    return `${publicKey.slice(0, 7)}...${publicKey.slice(-5)}`;
}
