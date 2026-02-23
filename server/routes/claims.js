const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Initialize a Claim
router.post('/init', verifyToken, async (req, res) => {
    try {
        const { foundItemId, lostItemId } = req.body;

        // Check if item exists and is available
        const foundItem = await prisma.foundItem.findUnique({ where: { id: foundItemId } });
        if (!foundItem || foundItem.status !== 'available') {
            return res.status(400).json({ error: 'Item not found or already claimed' });
        }

        // Check for existing pending claim by this user
        const existing = await prisma.claim.findFirst({
            where: { foundItemId, claimerId: req.user.id, status: 'pending' }
        });
        if (existing) return res.status(400).json({ error: 'You already have a pending claim for this item.' });

        const claim = await prisma.claim.create({
            data: {
                foundItemId,
                lostItemId: lostItemId || null,
                claimerId: req.user.id,
                status: 'pending'
            }
        });

        // Notify the finder that someone wants to claim their found item
        const { createNotification } = require('../utils/notificationService');
        await createNotification(foundItem.finderId, {
            title: 'New Claim Request',
            message: `Someone is claiming the ${foundItem.itemName} you found.`,
            type: 'claim',
            link: `/claim/${claim.id}`
        });

        res.json(claim);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Submit Verification Details
router.post('/verify/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;
        const { answers } = req.body; // Expecting JSON search keys

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) },
            include: { foundItem: true }
        });

        if (!claim || claim.claimerId !== req.user.id) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        const updatedClaim = await prisma.claim.update({
            where: { id: parseInt(claimId) },
            data: {
                verificationData: JSON.stringify(answers),
                status: 'pending' // Keeps it pending for Admin review
            }
        });

        // Notify Admin (Simple system notification to all admins)
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        const { createNotification } = require('../utils/notificationService');
        for (const admin of admins) {
            await createNotification(admin.id, {
                title: 'Claim Verification Submitted',
                message: `Verification details submitted for item ${claim.foundItem.itemName}.`,
                type: 'admin',
                link: `/admin/claims`
            });
        }

        res.json({ message: 'Verification details submitted. Waiting for admin approval.', claim: updatedClaim });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Claim Details
router.get('/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;
        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) },
            include: {
                foundItem: true,
                claimer: { select: { username: true, email: true } }
            }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        // Security: Only claimer, finder, or admin can view
        if (claim.claimerId !== req.user.id && claim.foundItem.finderId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access to claim' });
        }

        res.json(claim);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
