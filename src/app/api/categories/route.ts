import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { sql, and, eq, ilike, or } from 'drizzle-orm';
import { createCategorySchema } from '@/lib/validation/categories';

/**
 * GET /api/categories
 * Get all categories with product counts
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const shopId = sp.get('shopId') || undefined;
    const q = sp.get('q') || undefined;
    const limit = sp.get('limit') ? Math.min(2000, Math.max(1, Number(sp.get('limit')))) : undefined;

    const where = [] as any[];
    if (shopId) where.push(eq(categories.shopId, shopId));
    if (q) {
      const pattern = `%${q}%`;
      where.push(or(ilike(categories.name, pattern), ilike(categories.slug, pattern)));
    }

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
      .where(where.length ? and(...where) : undefined as any)
      .orderBy(categories.name)
      .limit(limit ?? 10000);

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

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const slug = (data.slug && data.slug.trim().length > 0)
      ? data.slug
      : data.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

    // Check unique constraint (name + parentId)
    const conflict = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.name, data.name), eq(categories.parentId, (data.parentId ?? null) as any)))
      .limit(1);
    if (conflict.length) {
      return NextResponse.json({ error: 'A category with this name already exists under the same parent.' }, { status: 400 });
    }

    const [created] = await db
      .insert(categories)
      .values({
        name: data.name,
        slug,
        description: data.description,
        parentId: (data.parentId ?? null) as any,
      })
      .returning();

    return NextResponse.json({ success: true, category: created }, { status: 201 });
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
