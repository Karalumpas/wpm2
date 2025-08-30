import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Get shop details
    const shop = await db
      .select()
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);

    if (!shop[0]) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Return shop info with encrypted credential lengths for debugging
    return NextResponse.json({
      shop: {
        id: shop[0].id,
        name: shop[0].name,
        url: shop[0].url,
        status: shop[0].status,
        consumerKeyLength: shop[0].consumerKeyEnc?.length || 0,
        consumerSecretLength: shop[0].consumerSecretEnc?.length || 0,
        consumerKeyFormat: shop[0].consumerKeyEnc?.includes(':')
          ? 'new'
          : 'old',
        consumerSecretFormat: shop[0].consumerSecretEnc?.includes(':')
          ? 'new'
          : 'old',
      },
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get shop info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
