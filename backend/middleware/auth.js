/**
 * auth.js — JWT Authentication Middleware
 * Extracted from server.js for modularity and reuse across routes.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nyaya-chain-secret-2024';

/**
 * requireAuth — Validates Bearer JWT token in Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * requireRole — Role-based access control middleware.
 * Must be used after requireAuth.
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
            });
        }
        next();
    };
}

/**
 * optionalAuth — Tries to authenticate but continues even if no token.
 * Attaches req.user if valid token is present, otherwise leaves it undefined.
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (_) {
            // Token invalid — proceed without user context
        }
    }
    next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
