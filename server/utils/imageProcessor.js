const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Generates a blurred/masked version of an image for privacy.
 * @param {string} originalRelativePath - Relative path to the original image in uploads/
 */
const generateMaskedImage = async (originalRelativePath) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        const originalPath = path.join(uploadsDir, originalRelativePath.replace('uploads/', ''));

        // Ensure original exists
        if (!fs.existsSync(originalPath)) {
            throw new Error(`Original image not found at ${originalPath}`);
        }

        const fileName = path.basename(originalPath);
        const maskedFileName = `masked_${fileName}`;
        const maskedPath = path.join(path.dirname(originalPath), maskedFileName);

        // Process image: Gaussian Blur (15-20 range for privacy)
        await sharp(originalPath)
            .blur(20)
            .toFile(maskedPath);

        const relativeDir = path.dirname(originalRelativePath);
        return path.join(relativeDir, maskedFileName).replace(/\\/g, '/');
    } catch (err) {
        console.error('❌ IMAGE BLUR ERROR:', err.message);
        return originalRelativePath; // Fallback to original if processing fails (safe reveal)
    }
};

const ENCRYPTION_KEY = Buffer.from(process.env.IMAGE_ENCRYPTION_KEY || 'default_32_byte_key_0123456789012', 'utf8');
const IV_LENGTH = 16;

const encryptFile = (inputPath, outputPath) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    output.write(iv);
    input.pipe(cipher).pipe(output);
};

const decryptFile = (inputPath, res) => {
    const input = fs.createReadStream(inputPath);
    input.once('readable', () => {
        const iv = input.read(IV_LENGTH);
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        input.pipe(decipher).pipe(res);
    });
};

module.exports = { generateMaskedImage, encryptFile, decryptFile };
