const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { decryptFile } = require('../utils/imageProcessor');
const prisma = new PrismaClient();
const path = require('path');

router.get('/original/:itemId', verifyToken, async (req, res) => {
    try {
        const { itemId } = req.params;

        // 1. Find Item
        const item = await prisma.foundItem.findUnique({ where: { id: parseInt(itemId) } });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        // 2. Access Control Check
        // Access allowed if:
        // - User is Admin
        // - User is the Finder
        // - User is a Claimer with status 'approved'
        let hasAccess = false;

        if (req.user.role === 'admin') hasAccess = true;
        if (item.finderId === req.user.id) hasAccess = true;

        const claim = await prisma.claim.findFirst({
            where: {
                foundItemId: item.id,
                claimerId: req.user.id,
                status: 'approved'
            }
        });
        if (claim) hasAccess = true;

        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to the unmasked image' });
        }

        // 3. Decrypt and Serve
        if (!item.originalImageUrl) return res.status(404).json({ error: 'Original image not found' });

        const decryptedBuffer = decryptFile(item.originalImageUrl);

        // Set proper content type (assuming jpg/png)
        const ext = path.extname(item.imageUrl).toLowerCase();
        res.set('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
        res.send(decryptedBuffer);

    } catch (err) {
        console.error('Image retrieval error:', err);
        res.status(500).json({ error: 'Error retrieving image' });
    }
});

module.exports = router;
