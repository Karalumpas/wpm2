import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { sql, ilike, or, and, eq } from 'drizzle-orm';
import { createBrandSchema } from '@/lib/validation/brands';

/**
 * GET /api/brands
 * Get all brands with product counts
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const q = sp.get('q') || undefined;
    const limit = sp.get('limit') ? Math.min(2000, Math.max(1, Number(sp.get('limit')))) : undefined;
    const where: any[] = [];
    if (q) {
      const pattern = `%${q}%`;
      where.push(ilike(brands.name, pattern));
    }
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
      .where(where.length ? and(...where) : undefined as any)
      .orderBy(brands.name)
      .limit(limit ?? 10000);

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

/**
 * POST /api/brands
 * Create a new brand
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createBrandSchema.parse(body);

    // Unique name
    const existing = await db.select({ id: brands.id }).from(brands).where(eq(brands.name, data.name)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: 'A brand with this name already exists.' }, { status: 400 });
    }

    const [created] = await db.insert(brands).values({ name: data.name }).returning();
    return NextResponse.json({ success: true, brand: created }, { status: 201 });
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
