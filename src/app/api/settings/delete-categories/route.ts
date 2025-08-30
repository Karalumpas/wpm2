import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, productCategories } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting delete all categories operation...');
    
    // Delete product-category associations first
    const deletedProductCategories = await db.delete(productCategories).returning({ 
      productId: productCategories.productId, 
      categoryId: productCategories.categoryId 
    });
    console.log(`🔸 Deleted ${deletedProductCategories.length} product-category associations`);
    
    // Delete categories
    const deletedCategories = await db.delete(categories).returning({ id: categories.id });
    console.log(`🔸 Deleted ${deletedCategories.length} categories`);
    
    const totalAffected = deletedProductCategories.length + deletedCategories.length;

    console.log('✅ Delete all categories operation completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'All categories deleted successfully',
      affectedRows: totalAffected,
      details: {
        categories: deletedCategories.length,
        productCategories: deletedProductCategories.length
      }
    });
  } catch (error) {
    console.error('❌ Delete categories error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
