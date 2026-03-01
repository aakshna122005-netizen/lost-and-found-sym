const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { generateMaskedImage, encryptFile } = require('../utils/imageProcessor');

// Helper to ensure directories exist
const dir = './uploads/originals';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/originals'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 1. Create Lost Item
router.post('/lost', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, color, material, dateLost, locationText, lat, lng, description, uniqueMarks } = req.body;

        if (!itemName || !category || !dateLost || !lat || !lng) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let maskedPath = null;
        let originalPath = null;

        if (req.file) {
            const relativePath = `uploads/originals/${req.file.filename}`;
            const maskImage = req.body.maskImage === 'true';

            if (maskImage) {
                maskedPath = await generateMaskedImage(relativePath);
                originalPath = relativePath + '.enc';
                encryptFile(req.file.path, path.join(__dirname, '../', originalPath));
                fs.unlinkSync(req.file.path); // Remove unencrypted original
            } else {
                maskedPath = relativePath;
                originalPath = relativePath;
            }
        }

        const item = await prisma.lostItem.create({
            data: {
                userId: req.user.id,
                itemName,
                category,
                color,
                material,
                dateLost: new Date(dateLost),
                locationText,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                description,
                uniqueMarks,
                imageUrl: maskedPath,
                originalImageUrl: originalPath,
                status: 'active'
            }
        });

        const { findMatches } = require('../utils/aiMatcher');
        findMatches(item, 'lost').catch(err => console.error('Matching Error:', err.message));

        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create Found Item
router.post('/found', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, lat, lng, condition, storagePlace, finderPreference, locationText } = req.body;

        if (!itemName || !category || !lat || !lng || !req.file) {
            return res.status(400).json({ error: 'Name, category, location, and image are mandatory.' });
        }

        const relativePath = `uploads/originals/${req.file.filename}`;
        const maskImage = req.body.maskImage === 'true';
        let maskedPath = null;
        let originalPath = null;

        if (maskImage) {
            maskedPath = await generateMaskedImage(relativePath);
            originalPath = relativePath + '.enc';
            encryptFile(req.file.path, path.join(__dirname, '../', originalPath));
            fs.unlinkSync(req.file.path); // Remove unencrypted original
        } else {
            maskedPath = relativePath;
            originalPath = relativePath;
        }

        const item = await prisma.foundItem.create({
            data: {
                finderId: req.user.id,
                itemName,
                category,
                locationText,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                condition,
                storagePlace,
                finderPreference,
                imageUrl: maskedPath,
                originalImageUrl: originalPath,
                status: 'active'
            }
        });

        const { findMatches } = require('../utils/aiMatcher');
        findMatches(item, 'found').catch(err => console.error('Matching Error:', err.message));

        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Items (Status: Active)
router.get('/lost', async (req, res) => {
    try {
        const items = await prisma.lostItem.findMany({
            where: { status: 'active' },
            include: { user: { select: { username: true } } }
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/found', async (req, res) => {
    try {
        const items = await prisma.foundItem.findMany({
            where: { status: 'active' }
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
