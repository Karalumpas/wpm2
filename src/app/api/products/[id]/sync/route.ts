import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update last synced timestamp
    await db
      .update(products)
      .set({
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // TODO: Implement actual WooCommerce sync logic here
    // This would involve:
    // 1. Fetching product data from WooCommerce API
    // 2. Comparing with local data
    // 3. Updating local database with remote changes
    // 4. Optionally pushing local changes to remote

    return NextResponse.json({
      success: true,
      message: 'Produkt synkroniseret succesfuldt',
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing product:', error);
    return NextResponse.json(
      { error: 'Failed to sync product' },
      { status: 500 }
    );
  }
}
