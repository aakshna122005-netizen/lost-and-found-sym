const router = require('express').Router();
const verifyToken = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Admin features are disabled for this local demo version
router.get('/claims/pending', verifyToken, isAdmin, async (req, res) => {
    return res.status(403).json({ error: 'Admin approval feature is temporarily disabled.' });
});

router.post('/claims/:id/action', verifyToken, isAdmin, async (req, res) => {
    return res.status(403).json({ error: 'Admin approval feature is temporarily disabled.' });
});

module.exports = router;
