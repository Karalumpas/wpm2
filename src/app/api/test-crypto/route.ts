import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    // Get the mgwp shop
    const shop = await db.select()
      .from(shops)
      .where(eq(shops.id, 'a69945f8-8d10-4139-9524-eb427cd5ed42'))
      .limit(1);

    if (!shop[0]) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shop[0];
    
    // Test decryption
    let consumerKey = '';
    let consumerSecret = '';
    let keyError = '';
    let secretError = '';
    
    try {
      consumerKey = decrypt(shopData.consumerKeyEnc);
    } catch (error) {
      keyError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    try {
      consumerSecret = decrypt(shopData.consumerSecretEnc);
    } catch (error) {
      secretError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      shop: {
        id: shopData.id,
        name: shopData.name,
        url: shopData.url,
      },
      encryption: {
        keyEncrypted: shopData.consumerKeyEnc,
        secretEncrypted: shopData.consumerSecretEnc,
        keyFormat: shopData.consumerKeyEnc?.includes(':') ? 'new (with IV)' : 'old (no IV)',
        secretFormat: shopData.consumerSecretEnc?.includes(':') ? 'new (with IV)' : 'old (no IV)',
        keyDecrypted: consumerKey || 'FAILED',
        secretDecrypted: consumerSecret || 'FAILED',
        keyError,
        secretError,
      }
    });

  } catch (error) {
    console.error('Test crypto error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test crypto',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
