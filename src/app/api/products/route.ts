import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth-utils'; // TODO: Fix auth issues
import { db } from '@/db';
import { products, productVariants } from '@/db/schema';
import { getProductsQuerySchema, type ProductsListResponse, type ProductListItem } from '@/lib/validation/products';
import { decodeCursor, generateNextCursor, checkHasMore } from '@/lib/utils/pagination';
import { eq, and, or, ilike, sql, desc, asc, gt, lt, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable authentication once auth is properly configured
    // Check authentication
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const requestParams = {
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      brandIds: searchParams.getAll('brandIds').filter(Boolean),
      categoryIds: searchParams.getAll('categoryIds').filter(Boolean),
    };

    console.log('🔍 Products API called with params:', requestParams);
    
    const validatedQuery = getProductsQuerySchema.parse(requestParams);
    console.log('✅ Validated query:', validatedQuery);

    // Build WHERE conditions
    const conditions = [];

    // Search condition
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`;
      conditions.push(
        or(
          ilike(products.name, searchTerm),
          ilike(products.sku, searchTerm)
        )
      );
    }

    // Status filter
    if (validatedQuery.status) {
      conditions.push(eq(products.status, validatedQuery.status));
    }

    // Type filter
    if (validatedQuery.type) {
      conditions.push(eq(products.type, validatedQuery.type));
    }

    // Cursor-based pagination condition
    if (validatedQuery.cursor) {
      try {
        const cursorData = decodeCursor(validatedQuery.cursor);
        const cursorDate = new Date(cursorData.updatedAt);
        
        if (validatedQuery.sortOrder === 'desc') {
          conditions.push(
            or(
              lt(products.updatedAt, cursorDate),
              and(
                eq(products.updatedAt, cursorDate),
                lt(products.id, cursorData.id)
              )
            )
          );
        } else {
          conditions.push(
            or(
              gt(products.updatedAt, cursorDate),
              and(
                eq(products.updatedAt, cursorDate),
                gt(products.id, cursorData.id)
              )
            )
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid cursor format' },
          { status: 400 }
        );
      }
    }

    // Combine all conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query products with Drizzle ORM
    const limit = validatedQuery.limit + 1; // Get one extra to check hasMore
    const sortOrder = validatedQuery.sortOrder === 'desc' ? desc : asc;
    
    const productResults = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        basePrice: products.basePrice,
        status: products.status,
        type: products.type,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(sortOrder(products.updatedAt), sortOrder(products.id))
      .limit(limit);

    console.log('📊 Raw products query result count:', productResults.length);
    console.log('📦 First product (if any):', productResults[0]);

    // Get variant counts separately for simplicity
    const productIds = productResults.slice(0, validatedQuery.limit).map(p => p.id);
    
    let variantCounts: Array<{ product_id: string; count: string }> = [];
    if (productIds.length > 0) {
      // Use Drizzle's inArray() for better parameter handling
      const variantCountResults = await db
        .select({
          productId: productVariants.productId,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
        .groupBy(productVariants.productId);
      
      variantCounts = variantCountResults.map(row => ({
        product_id: row.productId,
        count: row.count.toString()
      }));
    }
    
    const variantCountMap = new Map<string, number>();
    variantCounts.forEach((row: { product_id: string; count: string }) => {
      variantCountMap.set(row.product_id, Number(row.count));
    });

    // Check if there are more results
    const { items: productItems, hasMore } = checkHasMore(
      productResults,
      validatedQuery.limit
    );

    // Format response items
    const items: ProductListItem[] = productItems.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      basePrice: product.basePrice,
      status: product.status,
      type: product.type,
      updatedAt: product.updatedAt.toISOString(),
      variantCount: variantCountMap.get(product.id) || 0,
    }));

    // Generate next cursor if there are more results
    const nextCursor = hasMore && items.length > 0 
      ? generateNextCursor({
          updatedAt: items[items.length - 1].updatedAt,
          id: items[items.length - 1].id,
        })
      : undefined;

    const response: ProductsListResponse = {
      items,
      hasMore,
      nextCursor,
    };

    console.log('📤 Final response:', { itemCount: items.length, hasMore, nextCursor });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Products API error:', error);
    
    // Handle validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
