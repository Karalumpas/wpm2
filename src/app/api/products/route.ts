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
      shopIds: searchParams.getAll('shopIds').filter(Boolean),
    };

    const validatedQuery = getProductsQuerySchema.parse(requestParams);

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

    // Shop filter
    if (validatedQuery.shopIds && validatedQuery.shopIds.length > 0) {
      conditions.push(inArray(products.shopId, validatedQuery.shopIds));
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

    // Determine pagination mode and build query
    let productResults;
    let total: number | undefined;
    let paginationInfo = null;

    if (validatedQuery.page) {
      // Page-based pagination: use OFFSET/LIMIT
      const offset = (validatedQuery.page - 1) * validatedQuery.limit;
      
      // Get total count for pagination info
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause);
      
      total = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(total / validatedQuery.limit);
      const currentPage = validatedQuery.page;
      
      paginationInfo = {
        page: currentPage,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        cursor: validatedQuery.cursor,
        nextCursor: validatedQuery.cursor, // Initial value, will be updated if needed
      };

      // Query products with offset/limit
      const sortOrder = validatedQuery.sortOrder === 'desc' ? desc : asc;
      
      productResults = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          basePrice: products.basePrice,
          status: products.status,
          type: products.type,
          featuredImage: products.featuredImage,
          galleryImages: products.galleryImages,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(whereClause)
        .orderBy(sortOrder(products.updatedAt), sortOrder(products.id))
        .limit(validatedQuery.limit)
        .offset(offset);
    } else {
      // Cursor-based pagination: use keyset pagination
      const limit = validatedQuery.limit + 1; // Get one extra to check hasMore
      const sortOrder = validatedQuery.sortOrder === 'desc' ? desc : asc;
      
      productResults = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          basePrice: products.basePrice,
          status: products.status,
          type: products.type,
          featuredImage: products.featuredImage,
          galleryImages: products.galleryImages,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(whereClause)
        .orderBy(sortOrder(products.updatedAt), sortOrder(products.id))
        .limit(limit);
    }

    // Get variant counts separately for simplicity
    const actualProducts = validatedQuery.page ? productResults : productResults.slice(0, validatedQuery.limit);
    const productIds = actualProducts.map(p => p.id);
    
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

    // Check if there are more results (only for cursor-based pagination)
    let hasMore = false;
    let nextCursor: string | undefined;
    
    if (validatedQuery.page) {
      // For page-based pagination, hasMore is determined by pagination info
      hasMore = paginationInfo?.hasNext || false;
    } else {
      // For cursor-based pagination, check if we got extra results
      const checkResult = checkHasMore(productResults, validatedQuery.limit);
      hasMore = checkResult.hasMore;
      
      // Generate next cursor if there are more results
      if (hasMore && actualProducts.length > 0) {
        nextCursor = generateNextCursor({
          updatedAt: actualProducts[actualProducts.length - 1].updatedAt.toISOString(),
          id: actualProducts[actualProducts.length - 1].id,
        });
      }
    }

    // Format response items
    const items: ProductListItem[] = actualProducts.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      basePrice: product.basePrice,
      status: product.status,
      type: product.type,
      featuredImage: product.featuredImage,
      images: product.galleryImages as string[] || [],
      updatedAt: product.updatedAt.toISOString(),
      variantCount: variantCountMap.get(product.id) || 0,
    }));

    // Calculate pagination info for page-based pagination
    if (validatedQuery.page && paginationInfo) {
      // Update cursor information
      if (nextCursor) {
        paginationInfo.nextCursor = nextCursor;
      }
    }

    const response: ProductsListResponse = {
      items,
      hasMore,
      nextCursor,
      total: paginationInfo?.total,
      pagination: paginationInfo || undefined,
    };

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
