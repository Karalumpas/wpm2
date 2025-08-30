import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('Password utilities', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(20);
  });

  it('should verify a correct password', async () => {
    const password = 'testPassword123';
    const hashedPassword = await hashPassword(password);
    const isValid = await verifyPassword(password, hashedPassword);

    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'testPassword123';
    const wrongPassword = 'wrongPassword456';
    const hashedPassword = await hashPassword(password);
    const isValid = await verifyPassword(wrongPassword, hashedPassword);

    expect(isValid).toBe(false);
  });

  it('should handle empty passwords', async () => {
    const password = '';
    const hashedPassword = await hashPassword(password);
    const isValid = await verifyPassword(password, hashedPassword);

    expect(isValid).toBe(true);
  });
});
