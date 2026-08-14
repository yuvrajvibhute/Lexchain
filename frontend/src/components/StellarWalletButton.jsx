/**
 * StellarWalletButton.jsx — Freighter Connect / Disconnect UI Component
 *
 * A self-contained button that plugs into the LexChain design system.
 * Uses useStellarWallet() from StellarWalletContext.
 *
 * States:
 *   1. Not connected  → "Connect Freighter" (gold outlined button)
 *   2. Connecting     → spinner + "Connecting…"
 *   3. Connected      → abbreviated address + network badge + "Disconnect" on hover
 *
 * Props:
 *   compact {boolean} — If true, shows only the icon + short address (for navbars)
 *   style   {object}  — Extra inline styles
 */

import { useState } from 'react';
import { useStellarWallet } from '../context/StellarWalletContext';
import { shortenStellarKey } from '../utils/stellarWallet';

// Stellar logo SVG (inline, no external deps)
function StellarIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ flexShrink: 0 }}
            aria-hidden="true"
        >
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.95 6.364l-1.414 1.414A5.978 5.978 0 0 0 12 8a5.978 5.978 0 0 0-3.536 1.778L7.05 8.364A7.963 7.963 0 0 1 12 6a7.963 7.963 0 0 1 4.95 2.364zm-9.9 9.272l1.414-1.414A5.978 5.978 0 0 0 12 16a5.978 5.978 0 0 0 3.536-1.778l1.414 1.414A7.963 7.963 0 0 1 12 18a7.963 7.963 0 0 1-4.95-2.364zM12 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
    );
}

// Spinner
function Spinner() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ animation: 'lx-spin 0.8s linear infinite', flexShrink: 0 }}
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    );
}

const SPIN_CSS = `@keyframes lx-spin { to { transform: rotate(360deg); } }`;

export default function StellarWalletButton({ compact = false, style = {} }) {
    const { publicKey, isConnected, isConnecting, connectionError, network, connect, disconnect } =
        useStellarWallet();

    // Hover state for the connected pill (to show "Disconnect" label)
    const [hovered, setHovered] = useState(false);

    // ── Not connected ─────────────────────────────────────────────────────────
    if (!isConnected && !isConnecting) {
        return (
            <>
                <style>{SPIN_CSS}</style>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <button
                        id="freighter-connect-btn"
                        onClick={connect}
                        title="Connect your Freighter Stellar wallet"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            background: 'transparent',
                            border: '1px solid rgba(212,160,23,0.5)',
                            borderRadius: 8,
                            padding: compact ? '6px 12px' : '8px 16px',
                            color: '#d4a017',
                            fontSize: compact ? 12 : 13,
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            ...style,
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#d4a017'; e.currentTarget.style.background = 'rgba(212,160,23,0.08)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212,160,23,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <StellarIcon size={14} />
                        {!compact && 'Connect Freighter'}
                        {compact && 'Freighter'}
                    </button>
                    {connectionError && (
                        <div style={{
                            fontSize: 11,
                            color: '#ef4444',
                            maxWidth: 220,
                            textAlign: 'right',
                            lineHeight: 1.4,
                        }}>
                            {connectionError}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // ── Connecting ────────────────────────────────────────────────────────────
    if (isConnecting) {
        return (
            <>
                <style>{SPIN_CSS}</style>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'rgba(212,160,23,0.06)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    borderRadius: 8,
                    padding: compact ? '6px 12px' : '8px 16px',
                    color: '#d4a017',
                    fontSize: compact ? 12 : 13,
                    fontWeight: 600,
                    ...style,
                }}>
                    <Spinner />
                    Connecting…
                </div>
            </>
        );
    }

    // ── Connected ─────────────────────────────────────────────────────────────
    const netLabel = network
        ? (network.toLowerCase().includes('test') ? 'TESTNET' : network.slice(0, 10).toUpperCase())
        : 'TESTNET';

    return (
        <>
            <style>{SPIN_CSS}</style>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {/* Network badge */}
                {!compact && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 10,
                        color: '#22c55e',
                        fontFamily: "'IBM Plex Mono', monospace",
                        letterSpacing: '0.06em',
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#22c55e',
                            display: 'inline-block',
                            boxShadow: '0 0 6px #22c55e',
                        }} />
                        ⬡ STELLAR · {netLabel}
                    </div>
                )}

                {/* Address pill / disconnect button */}
                <button
                    id="freighter-disconnect-btn"
                    onClick={disconnect}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    title={`${publicKey}\n\nClick to disconnect`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        background: hovered ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                        border: hovered ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.35)',
                        borderRadius: 8,
                        padding: compact ? '6px 12px' : '8px 16px',
                        color: hovered ? '#ef4444' : '#22c55e',
                        fontSize: compact ? 11 : 13,
                        fontWeight: 600,
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        ...style,
                    }}
                >
                    <StellarIcon size={14} />
                    {hovered
                        ? (compact ? 'Disconnect' : '✕ Disconnect')
                        : shortenStellarKey(publicKey)
                    }
                </button>
            </div>
        </>
    );
}
