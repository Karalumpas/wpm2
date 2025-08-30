import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { decryptFromCompact } from '@/lib/security/crypto';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/shops/[id]/credentials - Get decrypted credentials for editing
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const [shop] = await db
      .select({
        id: shops.id,
        name: shops.name,
        url: shops.url,
        consumerKeyEnc: shops.consumerKeyEnc,
        consumerSecretEnc: shops.consumerSecretEnc,
      })
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Decrypt credentials
    let consumerKey = '';
    let consumerSecret = '';

    try {
      if (shop.consumerKeyEnc) {
        consumerKey = decryptFromCompact(shop.consumerKeyEnc);
      }
      if (shop.consumerSecretEnc) {
        consumerSecret = decryptFromCompact(shop.consumerSecretEnc);
      }
    } catch (decryptError) {
      console.error('Error decrypting credentials:', decryptError);
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: shop.id,
      name: shop.name,
      url: shop.url,
      consumerKey,
      consumerSecret,
    });
  } catch (error) {
    console.error('Error fetching shop credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
