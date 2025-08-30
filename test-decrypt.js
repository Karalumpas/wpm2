// Test decrypt functionality
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-for-development';
const ALGORITHM = 'aes-256-cbc';

function decryptOld(encryptedText) {
  try {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Old decrypt failed:', error.message);
    return null;
  }
}

function decryptNew(encryptedText) {
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('New decrypt failed:', error.message);
    return null;
  }
}

// Test data - replace with actual encrypted values from database
const testEncrypted = "example_encrypted_string_here";

console.log('Testing old decrypt:', decryptOld(testEncrypted));
console.log('Testing new decrypt:', decryptNew(testEncrypted));
