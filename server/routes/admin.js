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

// 1. View all pending claims
router.get('/claims/pending', verifyToken, isAdmin, async (req, res) => {
    try {
        const claims = await prisma.claim.findMany({
            where: { status: 'pending_review' },
            include: {
                claimer: { select: { username: true, email: true, trustScore: true } },
                foundItem: true,
                lostItem: true
            }
        });
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Approve/Reject Claim
router.post('/claims/:id/action', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; // 'approved' or 'rejected'

        const updatedClaim = await prisma.claim.update({
            where: { id: parseInt(id) },
            data: {
                status: status,
                // Log action in verificationData or a separate Audit table
            }
        });

        // If approved, update item status
        if (status === 'approved') {
            await prisma.foundItem.update({
                where: { id: updatedClaim.foundItemId },
                data: { status: 'claimed' }
            });
        }

        // Notify user logic (placeholder)
        // notificationService.notifyClaimStatus(updatedClaim.claimerId, status);

        res.json({ message: `Claim ${status}`, claim: updatedClaim });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
