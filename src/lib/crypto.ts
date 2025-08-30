import crypto from 'crypto';

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default-32-char-key-for-development';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is exactly 32 bytes
function getKey(): Buffer {
  if (ENCRYPTION_KEY.length === 32) {
    return Buffer.from(ENCRYPTION_KEY);
  } else if (ENCRYPTION_KEY.length > 32) {
    return Buffer.from(ENCRYPTION_KEY.substring(0, 32));
  } else {
    return Buffer.from(ENCRYPTION_KEY.padEnd(32, '0'));
  }
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const textParts = encryptedText.split(':');

  // Check if this is old format (no IV) or new format (with IV)
  if (textParts.length === 1) {
    // Old format - just return an error since createDecipher is deprecated
    throw new Error(
      'Old encryption format detected. Please re-encrypt credentials.'
    );
  } else {
    // New format - use IV-based decryption
    const ivString = textParts.shift()!;
    let iv: Buffer;
    let encryptedData: string;

    // Check if IV is base64 (new format) or hex (old new format)
    if (ivString.endsWith('==') || ivString.endsWith('=')) {
      // Base64 format
      iv = Buffer.from(ivString, 'base64');
      encryptedData = textParts.join(':');
      // Encrypted data is also base64 in this format
      const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } else {
      // Hex format
      iv = Buffer.from(ivString, 'hex');
      encryptedData = textParts.join(':');
      const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  }
}
