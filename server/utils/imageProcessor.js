const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const ALGORITHM = 'aes-256-ctr';
const ENCRYPTION_KEY = process.env.IMAGE_ENCRYPTION_KEY || 'default_32_byte_key_for_testing_purposes_only!!'; // Should be 32 bytes
const IV_LENGTH = 16;

/**
 * Encrypt a file at source and write to destination
 */
function encryptFile(sourcePath, destPath) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    const input = fs.readFileSync(sourcePath);
    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);

    fs.writeFileSync(destPath, encrypted);
    return destPath;
}

/**
 * Decrypt a file and return the buffer (not stored on disk)
 */
function decryptFile(sourcePath) {
    const data = fs.readFileSync(sourcePath);
    const iv = data.slice(0, IV_LENGTH);
    const encryptedText = data.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

    return decrypted;
}

/**
 * Call AI Service to mask an image
 */
async function maskImage(imagePath) {
    try {
        const response = await axios.post(`${process.env.AI_SERVICE_URL}/mask`, {
            image_path: path.resolve(imagePath)
        });
        return response.data;
    } catch (error) {
        console.error('Masking Error:', error.response?.data || error.message);
        throw new Error('AI Masking failed');
    }
}

module.exports = { encryptFile, decryptFile, maskImage };
