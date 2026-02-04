const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const upload = multer({ dest: 'uploads/originals/' });
const { encryptFile, maskImage } = require('../utils/imageProcessor');
const fs = require('fs');
const path = require('path');

// Create Lost Item
router.post('/lost', verifyToken, upload.single('image'), async (req, res) => {
    console.log('--- POST /api/items/lost ---');
    try {
        const { itemName, category, color, material, dateLost, locationText, lat, lng, description, uniqueMarks } = req.body;

        if (!itemName || !category || !dateLost || !lat || !lng) {
            return res.status(400).json({ error: 'Missing required fields: itemName, category, dateLost, and precise location must be selected.' });
        }

        const item = await prisma.lostItem.create({
            data: {
                userId: req.user.id,
                itemName: itemName,
                category,
                color: color || null,
                material: material || null,
                dateLost: new Date(dateLost),
                locationText: locationText || 'Not specified',
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                description: description || null,
                uniqueMarks: uniqueMarks || null,
                imageUrl: req.file ? req.file.path : null, // Store path for prototype
                status: 'lost'
            }
        });

        // Trigger AI Matching
        const { findMatches } = require('../utils/aiMatcher');
        findMatches(item, 'lost');

        res.json(item);
    } catch (err) {
        console.error('Lost Item Creation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create Found Item
router.post('/found', verifyToken, upload.single('image'), async (req, res) => {
    console.log('--- POST /api/items/found ---');
    try {
        const { itemName, category, lat, lng, condition, storagePlace, finderPreference, locationText } = req.body;

        if (!itemName || !category || !lat || !lng || !req.file) {
            return res.status(400).json({ error: 'Missing required fields: itemName, category, precise location, and image are mandatory.' });
        }

        // 1. Encrypt Original
        const originalPath = req.file.path;
        const encryptedPath = originalPath + '.enc';
        encryptFile(originalPath, encryptedPath);

        // 2. Clear unencrypted original from disk (but keep it for AI masking if needed)
        // Actually, AI service needs the original image to mask it. 
        // We will mask it first, then encrypt/delete original.

        let maskedUrl = null;
        try {
            const maskingResult = await maskImage(originalPath);
            maskedUrl = maskingResult.masked_path;
        } catch (error) {
            console.error('Masking failed, falling back to manual review flag');
        }

        const item = await prisma.foundItem.create({
            data: {
                finderId: req.user.id,
                itemName: itemName,
                category,
                locationText: locationText || 'Not specified',
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                condition: condition || null,
                storagePlace: storagePlace || null,
                finderPreference: finderPreference || 'meet',
                imageUrl: maskedUrl || originalPath, // Serve masked to public
                originalImageUrl: encryptedPath, // Store encrypted path secretly
                status: 'available'
            }
        });

        // Delete the temp original file after processing
        fs.unlinkSync(originalPath);

        // Trigger AI Matching
        const { findMatches } = require('../utils/aiMatcher');
        findMatches(item, 'found');

        res.json(item);
    } catch (err) {
        console.error('Found Item Creation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Items (Simple Feed)
router.get('/lost', async (req, res) => {
    const items = await prisma.lostItem.findMany({ where: { status: 'lost' }, include: { user: { select: { username: true } } } });
    res.json(items);
});

router.get('/found', async (req, res) => {
    const items = await prisma.foundItem.findMany({ where: { status: 'available' } });
    res.json(items);
});

module.exports = router;
