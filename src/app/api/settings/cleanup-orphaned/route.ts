import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants, productCategories, productBrands, categories, brands } from '@/db/schema';
import { notExists, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup orphaned records operation...');
    
    // Clean up orphaned product variants (variants without valid product)
    const deletedOrphanedVariants = await db.delete(productVariants)
      .where(
        notExists(
          db.select().from(products).where(eq(products.id, productVariants.productId))
        )
      )
      .returning({ id: productVariants.id });
    console.log(`🔸 Cleaned up ${deletedOrphanedVariants.length} orphaned product variants`);
    
    // Clean up orphaned product-category associations
    const deletedOrphanedProductCategories = await db.delete(productCategories)
      .where(
        notExists(
          db.select().from(products).where(eq(products.id, productCategories.productId))
        )
      )
      .returning({ productId: productCategories.productId, categoryId: productCategories.categoryId });
    console.log(`🔸 Cleaned up ${deletedOrphanedProductCategories.length} orphaned product-category associations (missing products)`);
    
    // Clean up product-category associations with missing categories
    const deletedOrphanedProductCategories2 = await db.delete(productCategories)
      .where(
        notExists(
          db.select().from(categories).where(eq(categories.id, productCategories.categoryId))
        )
      )
      .returning({ productId: productCategories.productId, categoryId: productCategories.categoryId });
    console.log(`🔸 Cleaned up ${deletedOrphanedProductCategories2.length} orphaned product-category associations (missing categories)`);
    
    // Clean up orphaned product-brand associations
    const deletedOrphanedProductBrands = await db.delete(productBrands)
      .where(
        notExists(
          db.select().from(products).where(eq(products.id, productBrands.productId))
        )
      )
      .returning({ productId: productBrands.productId, brandId: productBrands.brandId });
    console.log(`🔸 Cleaned up ${deletedOrphanedProductBrands.length} orphaned product-brand associations (missing products)`);
    
    // Clean up product-brand associations with missing brands
    const deletedOrphanedProductBrands2 = await db.delete(productBrands)
      .where(
        notExists(
          db.select().from(brands).where(eq(brands.id, productBrands.brandId))
        )
      )
      .returning({ productId: productBrands.productId, brandId: productBrands.brandId });
    console.log(`🔸 Cleaned up ${deletedOrphanedProductBrands2.length} orphaned product-brand associations (missing brands)`);
    
    const totalAffected = deletedOrphanedVariants.length + 
                          deletedOrphanedProductCategories.length + 
                          deletedOrphanedProductCategories2.length + 
                          deletedOrphanedProductBrands.length + 
                          deletedOrphanedProductBrands2.length;

    console.log('✅ Cleanup orphaned records operation completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Orphaned records cleaned up successfully',
      affectedRows: totalAffected,
      details: {
        orphanedVariants: deletedOrphanedVariants.length,
        orphanedProductCategories: deletedOrphanedProductCategories.length + deletedOrphanedProductCategories2.length,
        orphanedProductBrands: deletedOrphanedProductBrands.length + deletedOrphanedProductBrands2.length
      }
    });
  } catch (error) {
    console.error('❌ Cleanup orphaned records error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cleanup orphaned records',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
