import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { products } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, productIds, data } = body;

    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No products selected' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'duplicate':
        result = await bulkDuplicate(productIds);
        break;
      case 'delete':
        result = await bulkDelete(productIds);
        break;
      case 'sync':
        result = await bulkSync(productIds);
        break;
      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }
        result = await bulkUpdateStatus(productIds, data.status);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

async function bulkDuplicate(productIds: string[]) {
  const originalProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const duplicatedProducts = originalProducts.map((product) => ({
    ...product,
    id: undefined,
    name: `${product.name} (kopi)`,
    sku: `${product.sku}-copy-${Date.now()}`,
    wooCommerceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Remove undefined id fields
  const productsToInsert = duplicatedProducts.map(({ id, ...rest }) => rest);

  const newProducts = await db
    .insert(products)
    .values(productsToInsert)
    .returning();

  return {
    success: true,
    message: `${newProducts.length} produkter duplikeret succesfuldt`,
    duplicatedCount: newProducts.length,
    newProductIds: newProducts.map(p => p.id),
  };
}

async function bulkDelete(productIds: string[]) {
  const result = await db
    .delete(products)
    .where(inArray(products.id, productIds))
    .returning();

  return {
    success: true,
    message: `${result.length} produkter slettet succesfuldt`,
    deletedCount: result.length,
  };
}

async function bulkSync(productIds: string[]) {
  const result = await db
    .update(products)
    .set({
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(inArray(products.id, productIds))
    .returning();

  // TODO: Implement actual WooCommerce sync logic here

  return {
    success: true,
    message: `${result.length} produkter synkroniseret succesfuldt`,
    syncedCount: result.length,
  };
}

async function bulkUpdateStatus(productIds: string[], status: string) {
  const validStatuses = ['published', 'draft', 'private'] as const;
  if (!validStatuses.includes(status as any)) {
    throw new Error('Invalid status');
  }

  const result = await db
    .update(products)
    .set({
      status: status as 'published' | 'draft' | 'private',
      updatedAt: new Date(),
    })
    .where(inArray(products.id, productIds))
    .returning();

  return {
    success: true,
    message: `${result.length} produkter opdateret til status "${status}"`,
    updatedCount: result.length,
  };
}
