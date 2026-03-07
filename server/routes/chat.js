const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Use first 32 bytes of key as utf8 (consistent with imageProcessor)
const CHAT_KEY = Buffer.from(
    (process.env.CHAT_ENCRYPTION_KEY || 'default_32_byte_chat_key_00000000').slice(0, 32),
    'utf8'
);
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', CHAT_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const [ivHex, ...rest] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(rest.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', CHAT_KEY, iv);
        return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString();
    } catch { return '[encrypted message]'; }
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
            return res.status(403).json({ error: 'Unauthorized to chat' });
        }

        // Production Rule: Chat is ONLY unlocked when status is 'approved'
        if (claim.status !== 'approved' && claim.status !== 'completed') {
            return res.status(403).json({ error: 'Secure chat is locked until admin approval of ownership proof.' });
        }

        const encryptedContent = encrypt(content);

        const message = await prisma.chatMessage.create({
            data: {
                claimId: parseInt(claimId),
                senderId: req.user.id,
                content: encryptedContent
            }
        });

        res.json({ ...message, content });
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

        const isParticipant = (claim.claimerId === req.user.id || claim.foundItem.finderId === req.user.id);
        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        const messages = await prisma.chatMessage.findMany({
            where: { claimId: parseInt(claimId) },
            include: { sender: { select: { id: true, username: true } } },
            orderBy: { timestamp: 'asc' }
        });

        const decryptedMessages = messages.map(msg => ({
            id: msg.id,
            claimId: msg.claimId,
            senderId: msg.senderId,
            senderName: msg.sender?.username || 'Unknown',
            content: decrypt(msg.content),
            timestamp: msg.timestamp
        }));

        res.json(decryptedMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
