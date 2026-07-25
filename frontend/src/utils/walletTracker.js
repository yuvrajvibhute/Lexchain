/**
 * Wallet Interaction Tracker Utility
 * Records every wallet action to the backend for proof-of-interaction logging
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Record a wallet interaction both locally (analytics.js) and on the backend DB
 */
export async function recordWalletInteraction({ walletAddress, method, action, role, userId, name, metadata = {} }) {
  if (!walletAddress) return;

  // Backend persistence
  try {
    await fetch(`${API}/api/wallet-interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, method, action, role, userId, name, metadata }),
    });
  } catch (e) {
    // Silently fail - local analytics still records it
    console.warn('[WalletTracker] Backend save failed (recorded locally):', e.message);
  }
}

/**
 * Bulk seed known user wallet addresses (for 13 users provided by project owner)
 * Call this once with the 13 wallet addresses to pre-populate the DB
 */
export async function seedKnownWallets(wallets) {
  for (const w of wallets) {
    await recordWalletInteraction({
      walletAddress: w.address,
      method: w.method || 'metamask',
      action: w.action || 'registered',
      role: w.role || 'user',
      userId: w.userId || w.address,
      name: w.name || 'Known User',
      metadata: { seeded: true, note: w.note || 'Pre-registered user' },
    });
  }
}
