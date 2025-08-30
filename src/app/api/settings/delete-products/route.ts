import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  products,
  productVariants,
  productCategories,
  productBrands,
} from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting delete all products operation...');

    // Delete in correct order due to foreign key constraints
    const deletedVariants = await db
      .delete(productVariants)
      .returning({ id: productVariants.id });
    console.log(`🔸 Deleted ${deletedVariants.length} product variants`);

    const deletedProductCategories = await db
      .delete(productCategories)
      .returning({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      });
    console.log(
      `🔸 Deleted ${deletedProductCategories.length} product-category associations`
    );

    const deletedProductBrands = await db.delete(productBrands).returning({
      productId: productBrands.productId,
      brandId: productBrands.brandId,
    });
    console.log(
      `🔸 Deleted ${deletedProductBrands.length} product-brand associations`
    );

    const deletedProducts = await db
      .delete(products)
      .returning({ id: products.id });
    console.log(`🔸 Deleted ${deletedProducts.length} products`);

    const totalAffected =
      deletedVariants.length +
      deletedProductCategories.length +
      deletedProductBrands.length +
      deletedProducts.length;

    console.log('✅ Delete all products operation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'All products deleted successfully',
      affectedRows: totalAffected,
      details: {
        products: deletedProducts.length,
        variants: deletedVariants.length,
        productCategories: deletedProductCategories.length,
        productBrands: deletedProductBrands.length,
      },
    });
  } catch (error) {
    console.error('❌ Delete products error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
