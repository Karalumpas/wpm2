import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    // Fixed credentials for mgwp shop
    const shopId = 'a69945f8-8d10-4139-9524-eb427cd5ed42';
    const consumerKey = 'ck_fe3f97b0d1bb93c0fd95dec8a0d5d5b94893ddf6';
    const consumerSecret = 'cs_e0ba8b32ad14976fb482ce6e07c4bb8b38de2f24';

    // Encrypt the credentials with new method
    const encryptedKey = encrypt(consumerKey);
    const encryptedSecret = encrypt(consumerSecret);

    console.log('New encrypted key format:', encryptedKey);
    console.log('New encrypted secret format:', encryptedSecret);

    // Update shop with new encrypted credentials
    const result = await db
      .update(shops)
      .set({
        consumerKeyEnc: encryptedKey,
        consumerSecretEnc: encryptedSecret,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, shopId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'mgwp shop credentials updated successfully with new encryption method',
      shop: {
        id: result[0].id,
        name: result[0].name,
        url: result[0].url,
      },
      encryptionInfo: {
        keyLength: encryptedKey.length,
        secretLength: encryptedSecret.length,
        hasIV: encryptedKey.includes(':') && encryptedSecret.includes(':'),
      }
    });

  } catch (error) {
    console.error('Fix mgwp API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix mgwp credentials',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
