import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brands, productBrands } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting delete all brands operation...');
    
    // Delete product-brand associations first
    const deletedProductBrands = await db.delete(productBrands).returning({ 
      productId: productBrands.productId, 
      brandId: productBrands.brandId 
    });
    console.log(`🔸 Deleted ${deletedProductBrands.length} product-brand associations`);
    
    // Delete brands
    const deletedBrands = await db.delete(brands).returning({ id: brands.id });
    console.log(`🔸 Deleted ${deletedBrands.length} brands`);
    
    const totalAffected = deletedProductBrands.length + deletedBrands.length;

    console.log('✅ Delete all brands operation completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'All brands deleted successfully',
      affectedRows: totalAffected,
      details: {
        brands: deletedBrands.length,
        productBrands: deletedProductBrands.length
      }
    });
  } catch (error) {
    console.error('❌ Delete brands error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete brands',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
