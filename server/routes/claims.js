const router = require('express').Router();
const verifyToken = require('../middleware/auth');

// All claim features are disabled for this demo version
router.post('/init', verifyToken, async (req, res) => {
    return res.status(403).json({ error: 'Claiming feature is temporarily disabled in this version.' });
});

router.post('/verify/:claimId', verifyToken, async (req, res) => {
    return res.status(403).json({ error: 'Verification feature is temporarily disabled in this version.' });
});

router.get('/:claimId', verifyToken, async (req, res) => {
    return res.status(403).json({ error: 'Unauthorized' });
});

module.exports = router;
