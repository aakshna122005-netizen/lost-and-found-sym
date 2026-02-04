const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const { maskImage } = require('../utils/imageProcessor');
const upload = multer({ dest: 'uploads/originals/' });

// 1. File a Claim (Lost User claims a Found Item)
router.post('/init', verifyToken, async (req, res) => {
    try {
        const { lostItemId, foundItemId } = req.body;

        // Anti-Fraud: Limit active claims per user (e.g., 5 per day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyClaims = await prisma.claim.count({
            where: {
                claimerId: req.user.id,
                createdAt: { gte: today }
            }
        });

        if (dailyClaims >= 5) {
            return res.status(429).json({ error: 'Daily claim limit reached. Please try again tomorrow.' });
        }

        // Verify existence
        const foundItem = await prisma.foundItem.findUnique({ where: { id: parseInt(foundItemId) } });
        if (!foundItem) return res.status(404).json({ error: 'Found item not found' });

        // Create Claim
        const claim = await prisma.claim.create({
            data: {
                lostItemId: lostItemId ? parseInt(lostItemId) : null,
                foundItemId: parseInt(foundItemId),
                claimerId: req.user.id,
                status: 'pending'
            }
        });

        res.json(claim);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Submit Verification Details (Answers + Proof Image)
router.post('/verify/:claimId', verifyToken, upload.single('proof'), async (req, res) => {
    try {
        const { claimId } = req.params;
        const { detailedDescription, secretMarks, contentInventory } = req.body;

        const claim = await prisma.claim.findUnique({ where: { id: parseInt(claimId) } });
        if (!claim || claim.claimerId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized or claim not found' });
        }

        // Handle Proof Image (Mask it just like items)
        let maskedProofUrl = null;
        if (req.file) {
            try {
                const maskingResult = await maskImage(req.file.path);
                maskedProofUrl = maskingResult.masked_path;
            } catch (err) {
                console.error('Proof masking failed:', err);
                maskedProofUrl = req.file.path; // Fallback to raw if logic fails (unsafe but for prototype)
            }
        }

        const verificationData = JSON.stringify({
            detailedDescription,
            secretMarks,
            contentInventory,
            submittedAt: new Date()
        });

        const updatedClaim = await prisma.claim.update({
            where: { id: parseInt(claimId) },
            data: {
                verificationData,
                proofUrl: maskedProofUrl,
                status: 'pending_review'
            }
        });

        res.json(updatedClaim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Claim Details (For Finder to review)
router.get('/:claimId', verifyToken, async (req, res) => {
    try {
        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(req.params.claimId) },
            include: {
                lostItem: true,
                foundItem: true,
                claimer: { select: { username: true, email: true } }
            }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        // Security check: Only Finder or Claimer can view
        // We know claimerId. We need to check finderId from FoundItem
        if (claim.claimerId !== req.user.id && claim.foundItem.finderId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
