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
    const limit = sp.get('limit')
      ? Math.min(2000, Math.max(1, Number(sp.get('limit'))))
      : undefined;

    let whereClause:
      | ReturnType<typeof eq>
      | ReturnType<typeof or>
      | ReturnType<typeof and>
      | undefined;
    if (shopId && q) {
      const pattern = `%${q}%`;
      whereClause = and(
        eq(categories.shopId, shopId),
        or(ilike(categories.name, pattern), ilike(categories.slug, pattern))
      );
    } else if (shopId) {
      whereClause = eq(categories.shopId, shopId);
    } else if (q) {
      const pattern = `%${q}%`;
      whereClause = or(
        ilike(categories.name, pattern),
        ilike(categories.slug, pattern)
      );
    } else {
      whereClause = undefined;
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
      .where(whereClause)
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

    const slug =
      data.slug && data.slug.trim().length > 0
        ? data.slug
        : data.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

    // Check unique constraint (name + parentId)
    const parentValue: string | null = data.parentId ?? null;
    const parentCondition =
      parentValue === null
        ? sql`categories.parent_id IS NULL`
        : eq(categories.parentId, parentValue);

    const conflict = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.name, data.name), parentCondition))
      .limit(1);
    if (conflict.length) {
      return NextResponse.json(
        {
          error:
            'A category with this name already exists under the same parent.',
        },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(categories)
      .values({
        name: data.name,
        slug,
        description: data.description,
        parentId: parentValue,
      })
      .returning();

    return NextResponse.json(
      { success: true, category: created },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
