import { NextResponse } from 'next/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * GET /api/brands
 * Get all brands with product counts
 */
export async function GET() {
  try {
    // Get brands with product counts
    const brandsWithCounts = await db
      .select({
        id: brands.id,
        name: brands.name,
        productCount: sql<number>`
          (SELECT COUNT(*) FROM product_brands WHERE brand_id = ${brands.id})
        `.as('productCount'),
      })
      .from(brands)
      .orderBy(brands.name);

    return NextResponse.json({
      success: true,
      brands: brandsWithCounts,
    });
  } catch (error) {
    console.error('❌ Brands API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
