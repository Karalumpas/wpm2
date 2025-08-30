import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { updateShopSchema } from '@/lib/validation/shops';
import { encryptToCompact, decryptFromCompact } from '@/lib/security/crypto';
import { WooCommerceClient } from '@/lib/woo/client';
import { eq, and, ne } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/shops/[id] - Get single shop
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const [shop] = await db
      .select({
        id: shops.id,
        name: shops.name,
        url: shops.url,
        status: shops.status,
        lastConnectionOk: shops.lastConnectionOk,
        lastConnectionCheckAt: shops.lastConnectionCheckAt,
        createdAt: shops.createdAt,
        updatedAt: shops.updatedAt,
      })
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Skip authentication for now
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateShopSchema.parse(body);

    // Get existing shop (without userId check for now)
    const [existingShop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.url !== undefined) {
      // Check if URL already exists (excluding current shop)
      const existingUrl = await db
        .select()
        .from(shops)
        .where(and(eq(shops.url, validatedData.url), ne(shops.id, id)))
        .limit(1);

      if (existingUrl.length > 0) {
        return NextResponse.json(
          { error: 'A shop with this URL already exists' },
          { status: 400 }
        );
      }

      updateData.url = validatedData.url;
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    // Handle credential updates
    if (validatedData.consumerKey || validatedData.consumerSecret) {
      if (!validatedData.consumerKey || !validatedData.consumerSecret) {
        return NextResponse.json(
          { error: 'Both consumer key and secret must be provided together' },
          { status: 400 }
        );
      }

      updateData.consumerKeyEnc = encryptToCompact(validatedData.consumerKey);
      updateData.consumerSecretEnc = encryptToCompact(
        validatedData.consumerSecret
      );
    }

    // Update shop
    const [updatedShop] = await db
      .update(shops)
      .set(updateData)
      .where(eq(shops.id, id))
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

    // Test connection if requested or credentials were updated
    const shouldTest =
      request.nextUrl.searchParams.get('test') === 'true' ||
      validatedData.consumerKey ||
      validatedData.consumerSecret ||
      validatedData.url;

    if (shouldTest) {
      try {
        // Get current credentials
        const currentShop = await db
          .select()
          .from(shops)
          .where(eq(shops.id, id))
          .limit(1);

        const consumerKey = decryptFromCompact(currentShop[0].consumerKeyEnc);
        const consumerSecret = decryptFromCompact(
          currentShop[0].consumerSecretEnc
        );

        const client = new WooCommerceClient({
          baseUrl: updatedShop.url,
          consumerKey,
          consumerSecret,
        });

        const testResult = await client.testConnection();

        await db
          .update(shops)
          .set({
            lastConnectionOk: testResult.auth,
            lastConnectionCheckAt: new Date(),
            status: testResult.auth ? 'active' : 'error',
          })
          .where(eq(shops.id, id));

        updatedShop.lastConnectionOk = testResult.auth;
        updatedShop.lastConnectionCheckAt = new Date();
        updatedShop.status = testResult.auth ? 'active' : 'error';
      } catch (connectionError) {
        console.error('Connection test failed:', connectionError);
        await db
          .update(shops)
          .set({
            lastConnectionOk: false,
            lastConnectionCheckAt: new Date(),
            status: 'error',
          })
          .where(eq(shops.id, id));

        updatedShop.lastConnectionOk = false;
        updatedShop.lastConnectionCheckAt = new Date();
        updatedShop.status = 'error';
      }
    }

    return NextResponse.json(updatedShop);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error updating shop:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Skip authentication for now
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id } = await params;

    // Verify shop exists (without userId check for now)
    const [existingShop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Delete shop
    await db.delete(shops).where(eq(shops.id, id));

    return NextResponse.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
