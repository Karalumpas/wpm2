import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptToCompact,
  decryptFromCompact,
  generateEncryptionKey,
} from '@/lib/security/crypto';

// Mock environment variable
const mockEncryptionKey = generateEncryptionKey();

vi.mock('process', () => ({
  env: {
    ENCRYPTION_KEY: mockEncryptionKey,
  },
}));

describe('Crypto utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string successfully', () => {
      const plaintext = 'test-consumer-key-123';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same input (due to IV)', () => {
      const plaintext = 'test-data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should have consistent data structure', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.tag).toBe('string');
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'test-string-with-åäö-and-emojis-🚀🔐';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('compact format', () => {
    it('should encrypt and decrypt using compact format', () => {
      const plaintext = 'consumer-secret-abc123';
      const compact = encryptToCompact(plaintext);
      const decrypted = decryptFromCompact(compact);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce valid compact format', () => {
      const plaintext = 'test-data';
      const compact = encryptToCompact(plaintext);
      const parts = compact.split(':');

      expect(parts.length).toBe(3);
      expect(parts[0]).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 IV
      expect(parts[1]).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 tag
      expect(parts[2]).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 ciphertext
    });

    it('should throw error for invalid compact format', () => {
      expect(() => decryptFromCompact('invalid')).toThrow(
        'Invalid encrypted data format'
      );
      expect(() => decryptFromCompact('part1:part2')).toThrow(
        'Invalid encrypted data format'
      );
      expect(() => decryptFromCompact('part1:part2:part3:part4')).toThrow(
        'Invalid encrypted data format'
      );
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate valid encryption key', () => {
      const key = generateEncryptionKey();

      expect(key).toMatch(/^base64:/);

      const keyData = key.slice(7);
      const buffer = Buffer.from(keyData, 'base64');
      expect(buffer.length).toBe(32);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });
});
