/**
 * rateLimit.js — Simple in-memory rate limiting middleware for LexChain API
 * Uses sliding window counter per IP. No external dependencies required.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const requestCounts = new Map(); // ip -> { count, windowStart }

/**
 * createRateLimiter — Factory for route-specific rate limiters.
 * @param {object} opts
 * @param {number} opts.max        - Max requests per window
 * @param {number} opts.windowMs   - Window duration in ms (default: 15 min)
 * @param {string} opts.message    - Error message on limit exceeded
 */
function createRateLimiter({ max = 100, windowMs = WINDOW_MS, message = 'Too many requests. Please try again later.' } = {}) {
    return (req, res, next) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const now = Date.now();
        const key = `${ip}:${req.baseUrl || req.path}`;

        const entry = requestCounts.get(key) || { count: 0, windowStart: now };

        // Reset window if expired
        if (now - entry.windowStart > windowMs) {
            entry.count = 0;
            entry.windowStart = now;
        }

        entry.count += 1;
        requestCounts.set(key, entry);

        // Set informational headers
        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', Math.max(0, max - entry.count));
        res.set('X-RateLimit-Reset', Math.ceil((entry.windowStart + windowMs) / 1000));

        if (entry.count > max) {
            return res.status(429).json({
                error: message,
                retryAfter: Math.ceil((entry.windowStart + windowMs - now) / 1000)
            });
        }

        next();
    };
}

// Pre-configured limiters for common use cases
const apiLimiter = createRateLimiter({ max: 200 });                          // general API
const authLimiter = createRateLimiter({ max: 10, message: 'Too many login attempts. Please wait 15 minutes.' });  // auth routes
const evidenceLimiter = createRateLimiter({ max: 30, message: 'Evidence upload rate limit exceeded.' });          // evidence upload

// Cleanup old entries every 30 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requestCounts.entries()) {
        if (now - entry.windowStart > WINDOW_MS * 2) {
            requestCounts.delete(key);
        }
    }
}, 30 * 60 * 1000);

module.exports = { createRateLimiter, apiLimiter, authLimiter, evidenceLimiter };
