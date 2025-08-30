import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-for-development';
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

function encryptNew(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function POST(request: NextRequest) {
  try {
    // Hard-coded credentials for mgwp shop
    const consumerKey = 'ck_fe3f97b0d1bb93c0fd95dec8a0d5d5b94893ddf6';
    const consumerSecret = 'cs_e0ba8b32ad14976fb482ce6e07c4bb8b38de2f24';
    
    // Encrypt with new method
    const encryptedKey = encryptNew(consumerKey);
    const encryptedSecret = encryptNew(consumerSecret);
    
    console.log('Encrypting credentials for mgwp shop...');
    console.log('Consumer Key:', consumerKey);
    console.log('Encrypted Key:', encryptedKey);
    console.log('Consumer Secret:', consumerSecret);
    console.log('Encrypted Secret:', encryptedSecret);

    // Update shop
    const result = await db
      .update(shops)
      .set({
        consumerKeyEnc: encryptedKey,
        consumerSecretEnc: encryptedSecret,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, 'a69945f8-8d10-4139-9524-eb427cd5ed42'))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'mgwp shop credentials re-encrypted successfully',
      shop: result[0],
      newCredentials: {
        keyLength: encryptedKey.length,
        secretLength: encryptedSecret.length,
        keyHasIV: encryptedKey.includes(':'),
        secretHasIV: encryptedSecret.includes(':'),
      }
    });

  } catch (error) {
    console.error('Force update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update credentials',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
