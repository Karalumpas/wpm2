import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops, products } from '@/db/schema';
import { createShopSchema } from '@/lib/validation/shops';
import { encryptToCompact } from '@/lib/security/crypto';
import { WooCommerceClient } from '@/lib/woo/client';
import { eq, count } from 'drizzle-orm';

export async function GET() {
  try {
    // Get shops with product counts for filtering
    const userShops = await db
      .select({
        id: shops.id,
        name: shops.name,
        url: shops.url,
        status: shops.status,
        lastConnectionOk: shops.lastConnectionOk,
        lastConnectionCheckAt: shops.lastConnectionCheckAt,
        createdAt: shops.createdAt,
        updatedAt: shops.updatedAt,
        productCount: count(products.id),
      })
      .from(shops)
      .leftJoin(products, eq(shops.id, products.shopId))
      .groupBy(shops.id)
      .orderBy(shops.updatedAt);

    // Format for filter dropdown
    const shopsForFilter = userShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      count: shop.productCount,
    }));

    return NextResponse.json({ shops: shopsForFilter });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = createShopSchema.parse(body);

    // Check if URL already exists
    const existingShop = await db
      .select()
      .from(shops)
      .where(eq(shops.url, validatedData.url))
      .limit(1);

    if (existingShop.length > 0) {
      return NextResponse.json(
        { error: 'A shop with this URL already exists' },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const consumerKeyEnc = encryptToCompact(validatedData.consumerKey);
    const consumerSecretEnc = encryptToCompact(validatedData.consumerSecret);

    // Create shop in database - without userId for now (until auth is implemented)
    const [newShop] = await db
      .insert(shops)
      .values({
        // userId: null, // Skip userId until proper authentication is implemented
        name: validatedData.name,
        url: validatedData.url,
        consumerKeyEnc,
        consumerSecretEnc,
        status: 'active',
      })
      .returning({
        id: shops.id,
        name: shops.name,
        url: shops.url,
        status: shops.status,
        lastConnectionOk: shops.lastConnectionOk,
        lastConnectionCheckAt: shops.lastConnectionCheckAt,
        createdAt: shops.createdAt,
        updatedAt: shops.updatedAt,
      });

    // Test connection and update shop
    try {
      const client = new WooCommerceClient({
        baseUrl: validatedData.url,
        consumerKey: validatedData.consumerKey,
        consumerSecret: validatedData.consumerSecret,
      });

      const testResult = await client.testConnection();

      await db
        .update(shops)
        .set({
          lastConnectionOk: testResult.auth,
          lastConnectionCheckAt: new Date(),
          status: testResult.auth ? 'active' : 'error',
        })
        .where(eq(shops.id, newShop.id));

      newShop.lastConnectionOk = testResult.auth;
      newShop.lastConnectionCheckAt = new Date();
      newShop.status = testResult.auth ? 'active' : 'error';
    } catch (connectionError) {
      console.error('Connection test failed:', connectionError);
      await db
        .update(shops)
        .set({
          lastConnectionOk: false,
          lastConnectionCheckAt: new Date(),
          status: 'error',
        })
        .where(eq(shops.id, newShop.id));

      newShop.lastConnectionOk = false;
      newShop.lastConnectionCheckAt = new Date();
      newShop.status = 'error';
    }

    return NextResponse.json(newShop, { status: 201 });
  } catch (error) {
    console.error('Error creating shop - Full details:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Validation error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
