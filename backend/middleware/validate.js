/**
 * validate.js — Input validation & sanitization middleware for LexChain API
 * Prevents XSS injection and validates required fields before hitting business logic.
 */

// Strip dangerous HTML/script tags from a string value
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')     // strip all HTML tags
        .replace(/javascript:/gi, '') // block JS URIs
        .trim();
}

// Recursively sanitize all string values in an object
function sanitizeBody(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string') {
            sanitized[key] = sanitizeString(val);
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            sanitized[key] = sanitizeBody(val);
        } else {
            sanitized[key] = val;
        }
    }
    return sanitized;
}

/**
 * sanitize — Middleware that sanitizes all request body string fields.
 */
function sanitize(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeBody(req.body);
    }
    next();
}

/**
 * validateRequired — Middleware factory that checks required fields are present and non-empty.
 * @param {...string} fields - Field names required in req.body
 */
function validateRequired(...fields) {
    return (req, res, next) => {
        const missing = fields.filter(f => {
            const val = req.body[f];
            return val === undefined || val === null || val === '';
        });
        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missing.join(', ')}`
            });
        }
        next();
    };
}

/**
 * validateEvidenceUpload — Specific validator for POST /api/evidence
 */
function validateEvidenceUpload(req, res, next) {
    const { name, officer, station } = req.body;
    if (!name || !officer || !station) {
        return res.status(400).json({ error: 'Evidence requires: name, officer, station' });
    }
    // Check file size if present (max 50MB)
    if (req.file && req.file.size > 50 * 1024 * 1024) {
        return res.status(413).json({ error: 'File too large. Maximum upload size is 50MB.' });
    }
    next();
}

/**
 * validateWalletAuth — Validates wallet auth payload
 */
function validateWalletAuth(req, res, next) {
    const { address, signature, message } = req.body;
    if (!address || !signature || !message) {
        return res.status(400).json({ error: 'Wallet auth requires: address, signature, message' });
    }
    // Basic Stellar/Ethereum address format check
    const isStellar = /^G[A-Z2-7]{55}$/.test(address);
    const isEthereum = /^0x[a-fA-F0-9]{40}$/.test(address);
    if (!isStellar && !isEthereum) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    next();
}

module.exports = { sanitize, validateRequired, validateEvidenceUpload, validateWalletAuth };
