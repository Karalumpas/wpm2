import { NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * GET /api/categories
 * Get all categories with product counts
 */
export async function GET() {
  try {
    // Get categories with product counts
    const categoriesWithCounts = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        parentId: categories.parentId,
        productCount: sql<number>`
          (SELECT COUNT(*) FROM product_categories WHERE category_id = ${categories.id})
        `.as('productCount'),
      })
      .from(categories)
      .orderBy(categories.name);

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts,
    });
  } catch (error) {
    console.error('❌ Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
