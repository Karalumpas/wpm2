import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { brands, categories } from '@/db/schema';
import { type GetFiltersResponse } from '@/lib/validation/products';
import { memoryCache, CACHE_TTL } from '@/lib/cache/memory';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = 'products:filters';
    const cachedFilters = memoryCache.get<GetFiltersResponse>(cacheKey);

    if (cachedFilters) {
      return NextResponse.json(cachedFilters);
    }

    // Fetch all filter data in parallel
    const [brandsData, categoriesData] = await Promise.all([
      db
        .select({
          id: brands.id,
          name: brands.name,
        })
        .from(brands)
        .orderBy(brands.name),

      db
        .select({
          id: categories.id,
          name: categories.name,
          parentId: categories.parentId,
        })
        .from(categories)
        .orderBy(categories.name),
    ]);

    // Static filter values
    const statuses = ['published', 'draft', 'private'] as const;
    const types = ['simple', 'variable', 'grouped'] as const;

    const response: GetFiltersResponse = {
      brands: brandsData,
      categories: categoriesData,
      statuses: [...statuses],
      types: [...types],
    };

    // Cache the result
    memoryCache.set(cacheKey, response, CACHE_TTL.FILTERS);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Products filters API error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
