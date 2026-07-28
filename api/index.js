const app = require('../backend/server');

// Vercel serverless: the function is mounted at /api/* so req.url will be
// the part AFTER /api (e.g. /auth/wallet instead of /api/auth/wallet).
// We need to re-add /api so Express routes match correctly.
module.exports = (req, res) => {
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    app(req, res);
};
