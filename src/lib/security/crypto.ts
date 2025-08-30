import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // Remove 'base64:' prefix if present
  const keyData = key.startsWith('base64:') ? key.slice(7) : key;

  try {
    const buffer = Buffer.from(keyData, 'base64');
    if (buffer.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
    return buffer;
  } catch {
    throw new Error('Invalid ENCRYPTION_KEY format. Must be base64 encoded 32 bytes');
  }
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, 'base64');
  const tag = Buffer.from(data.tag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(data.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

// Compact storage format: iv:tag:ciphertext
export function encryptToCompact(plaintext: string): string {
  const encrypted = encrypt(plaintext);
  return `${encrypted.iv}:${encrypted.tag}:${encrypted.ciphertext}`;
}

export function decryptFromCompact(compact: string): string {
  const parts = compact.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  return decrypt({
    iv: parts[0],
    tag: parts[1],
    ciphertext: parts[2],
  });
}

// Generate a new encryption key (for setup)
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32);
  return `base64:${key.toString('base64')}`;
}
