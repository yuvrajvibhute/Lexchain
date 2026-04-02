/**
 * Client-side password utilities using the built-in Web Crypto API.
 * Passwords are stored hashed (SHA-256) in localStorage keyed by wallet address.
 * Key format:  lc_pw_<lowercaseAddress>
 */

const STORAGE_KEY = (address) => `lc_pw_${address.toLowerCase()}`;

/** SHA-256 hash a string → hex */
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash and save password for a wallet address.
 * @param {string} address  - Ethereum wallet address
 * @param {string} password - Plain-text password
 */
export async function savePassword(address, password) {
  const hash = await sha256(password + address.toLowerCase()); // salt with address
  localStorage.setItem(STORAGE_KEY(address), hash);
}

/**
 * Verify plain-text password against saved hash.
 * @param {string} address  - Ethereum wallet address
 * @param {string} password - Plain-text password to verify
 * @returns {boolean}
 */
export async function verifyPassword(address, password) {
  const stored = localStorage.getItem(STORAGE_KEY(address));
  if (!stored) return false; // No password registered for this address
  const hash = await sha256(password + address.toLowerCase());
  return hash === stored;
}

/**
 * Check if a wallet address has a registered password.
 * @param {string} address - Ethereum wallet address
 * @returns {boolean}
 */
export function hasPassword(address) {
  return Boolean(localStorage.getItem(STORAGE_KEY(address)));
}

/** Password strength checker — returns { score: 0-4, label, color } */
export function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "#334155" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["#334155", "#ef4444", "#f59e0b", "#22c55e", "#10b981"];
  return { score, label: labels[score] || "Weak", color: colors[score] };
}
