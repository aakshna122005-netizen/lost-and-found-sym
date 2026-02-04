const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || 'default_32_byte_key_for_testing_purposes_only!!'; // Should be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// 1. Send a message
router.post('/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;
        const { content } = req.body;

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) },
            include: { foundItem: true }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        // Access check: Only Finder or Claimer
        if (claim.claimerId !== req.user.id && claim.foundItem.finderId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Status check: Chat only allowed after verification or approval
        const allowedStatuses = ['approved', 'verified', 'completed'];
        if (!allowedStatuses.includes(claim.status)) {
            return res.status(403).json({ error: 'Chat is locked until ownership is verified' });
        }

        const encryptedContent = encrypt(content);

        const message = await prisma.chatMessage.create({
            data: {
                claimId: parseInt(claimId),
                senderId: req.user.id,
                content: encryptedContent
            }
        });

        res.json({ ...message, content: content }); // Return decrypted to sender
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get messages
router.get('/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) },
            include: { foundItem: true }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });
        if (claim.claimerId !== req.user.id && claim.foundItem.finderId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { claimId: parseInt(claimId) },
            orderBy: { timestamp: 'asc' }
        });

        const decryptedMessages = messages.map(msg => ({
            ...msg,
            content: decrypt(msg.content)
        }));

        res.json(decryptedMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
