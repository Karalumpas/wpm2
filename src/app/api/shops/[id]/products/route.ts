import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;

    // Delete product categories first (due to foreign key)
    await db
      .delete(productCategories)
      .where(
        eq(
          productCategories.productId,
          db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.shopId, shopId))
        )
      );

    // Delete products
    const deletedProducts = await db
      .delete(products)
      .where(eq(products.shopId, shopId))
      .returning({ id: products.id });

    return NextResponse.json({
      message: `Deleted ${deletedProducts.length} products from shop ${shopId}`,
      deletedCount: deletedProducts.length,
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}
