import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const { shopId, consumerKey, consumerSecret } = await request.json();

    if (!shopId || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Shop ID, consumer key, and consumer secret are required' },
        { status: 400 }
      );
    }

    // Encrypt the new credentials
    const encryptedKey = encrypt(consumerKey);
    const encryptedSecret = encrypt(consumerSecret);

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
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials updated successfully',
      shop: {
        id: result[0].id,
        name: result[0].name,
        url: result[0].url,
      },
    });
  } catch (error) {
    console.error('Re-encrypt API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
