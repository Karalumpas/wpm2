import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  products,
  productVariants,
  categories,
  brands,
  shops,
} from '@/db/schema';
import { count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const [
      productsCount,
      variantsCount,
      categoriesCount,
      brandsCount,
      shopsCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(products),
      db.select({ count: count() }).from(productVariants),
      db.select({ count: count() }).from(categories),
      db.select({ count: count() }).from(brands),
      db.select({ count: count() }).from(shops),
    ]);

    return NextResponse.json({
      products: productsCount[0].count,
      variants: variantsCount[0].count,
      categories: categoriesCount[0].count,
      brands: brandsCount[0].count,
      shops: shopsCount[0].count,
    });
  } catch (error) {
    console.error('Database stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
