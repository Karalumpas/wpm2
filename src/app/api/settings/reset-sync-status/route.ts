import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants, categories } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting reset sync status operation...');

    // Reset lastSyncedAt for products
    const updatedProducts = await db
      .update(products)
      .set({ lastSyncedAt: null })
      .returning({ id: products.id });
    console.log(`🔸 Reset sync status for ${updatedProducts.length} products`);

    // Reset lastSyncedAt for product variants
    const updatedVariants = await db
      .update(productVariants)
      .set({ lastSyncedAt: null })
      .returning({ id: productVariants.id });
    console.log(
      `🔸 Reset sync status for ${updatedVariants.length} product variants`
    );

    // Reset lastSyncedAt for categories
    const updatedCategories = await db
      .update(categories)
      .set({ lastSyncedAt: null })
      .returning({ id: categories.id });
    console.log(
      `🔸 Reset sync status for ${updatedCategories.length} categories`
    );

    const totalAffected =
      updatedProducts.length +
      updatedVariants.length +
      updatedCategories.length;

    console.log('✅ Reset sync status operation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Sync status reset successfully',
      affectedRows: totalAffected,
      details: {
        products: updatedProducts.length,
        variants: updatedVariants.length,
        categories: updatedCategories.length,
      },
    });
  } catch (error) {
    console.error('❌ Reset sync status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
