const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// 1. Get all pending claims for admin
router.get('/claims/pending', verifyToken, isAdmin, async (req, res) => {
    try {
        const claims = await prisma.claim.findMany({
            where: { status: 'pending' },
            include: {
                claimer: { select: { username: true, email: true } },
                foundItem: { include: { finder: { select: { username: true, email: true } } } },
                lostItem: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(claims);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Approve or Reject a Claim
router.post('/claims/:id/action', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(id) },
            include: { foundItem: true, claimer: true }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        if (action === 'approve') {
            // Update claim status
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'approved' }
            });

            // Update found item status to claimed
            await prisma.foundItem.update({
                where: { id: claim.foundItemId },
                data: { status: 'claimed' }
            });

            // Notify Claimer
            const { createNotification } = require('../utils/notificationService');
            await createNotification(claim.claimerId, {
                title: 'Claim Approved! 🎉',
                message: `Your claim for ${claim.foundItem.itemName} has been approved by the admin. You can now chat with the finder.`,
                type: 'system',
                link: `/claim/${claim.id}`
            });

            // Notify Finder
            await createNotification(claim.foundItem.finderId, {
                title: 'Claim Verified',
                message: `The claim for your found item ${claim.foundItem.itemName} has been verified. You can now coordinate handover.`,
                type: 'system',
                link: `/claim/${claim.id}`
            });

            res.json({ message: 'Claim approved successfully' });
        } else if (action === 'reject') {
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'rejected' }
            });

            // Notify Claimer
            const { createNotification } = require('../utils/notificationService');
            await createNotification(claim.claimerId, {
                title: 'Claim Rejected',
                message: `Your claim for ${claim.foundItem.itemName} was not approved after manual review.`,
                type: 'system',
                link: `/claim/${claim.id}`
            });

            res.json({ message: 'Claim rejected' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
