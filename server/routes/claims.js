const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { enforceStateMachine } = require('../middleware/stateMachine');

// 1. Initialize a Claim
router.post('/init', verifyToken, async (req, res) => {
    try {
        const { foundItemId, lostItemId } = req.body;

        const foundItem = await prisma.foundItem.findUnique({ where: { id: foundItemId } });
        if (!foundItem || (foundItem.status !== 'active' && foundItem.status !== 'match_found')) {
            return res.status(400).json({ error: 'Item is not available for claim.' });
        }

        const claim = await prisma.claim.create({
            data: {
                foundItemId,
                lostItemId: lostItemId || null,
                claimerId: req.user.id,
                status: 'verification_pending'
            }
        });

        // Notify finder
        const { createNotification } = require('../utils/notificationService');
        await createNotification(foundItem.finderId, {
            title: 'Action Required: Verification Pending',
            message: `Someone is attempting to verify ownership of the ${foundItem.itemName}.`,
            type: 'claim',
            link: `/claim/${claim.id}`
        });

        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Submit Verification Details (Moves to Admin Review)
router.post('/verify/:id', verifyToken, enforceStateMachine('claim'), async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationData, claimProof } = req.body;

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(id) },
            include: { foundItem: true }
        });

        if (!claim || claim.claimerId !== req.user.id) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        if (claim.status !== 'verification_pending') {
            return res.status(400).json({ error: 'Verification cannot be submitted in current state.' });
        }

        // Automatic Verification Logic
        let isMatch = true;
        if (claim.lostItem && claim.lostItem.uniqueMarks && verificationData.secretMarks) {
            const marksL = claim.lostItem.uniqueMarks.toLowerCase();
            const marksV = verificationData.secretMarks.toLowerCase();
            const wordsL = marksL.split(/\\W+/).filter(w => w.length > 3);
            if (wordsL.length > 0) {
                const hasCommon = wordsL.some(w => marksV.includes(w));
                if (!hasCommon) isMatch = false;
            }
        }

        if (!isMatch) {
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'verification_failed', verificationData: JSON.stringify(verificationData) }
            });
            await prisma.foundItem.update({
                where: { id: claim.foundItemId },
                data: { status: 'active' }
            });
            if (claim.lostItemId) {
                await prisma.lostItem.update({
                    where: { id: claim.lostItemId },
                    data: { status: 'active' }
                });
            }
            return res.json({ message: 'Verification failed. Answers did not match the original record. Search will continue.', claim: { status: 'verification_failed' } });
        }

        const updatedClaim = await prisma.claim.update({
            where: { id: parseInt(id) },
            data: {
                verificationData: JSON.stringify(verificationData),
                claimProof: claimProof || null,
                status: 'admin_review'
            }
        });

        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        const { createNotification } = require('../utils/notificationService');
        for (const admin of admins) {
            await createNotification(admin.id, {
                title: 'New Admin Review Required',
                message: `New proof submitted for item ${claim.foundItem.itemName}.`,
                type: 'admin',
                link: `/admin/claims`
            });
        }

        res.json({ message: 'Submitted for admin review.', claim: updatedClaim });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get My Claims
router.get('/my-claims', verifyToken, async (req, res) => {
    try {
        const claims = await prisma.claim.findMany({
            where: { claimerId: req.user.id },
            include: { foundItem: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;
        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) },
            include: {
                foundItem: true,
                lostItem: true,
                claimer: { select: { username: true, email: true, trustScore: true } }
            }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        // Security: Restrict access
        const isParticipant = claim.claimerId === req.user.id || claim.foundItem.finderId === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isParticipant && !isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
