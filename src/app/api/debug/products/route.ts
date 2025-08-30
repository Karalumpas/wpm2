import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { count, sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Checking database connection...');
    
    // Check total product count
    const [totalResult] = await db.select({ count: count() }).from(products);
    console.log('Total products in database:', totalResult.count);
    
    // Get first 3 products with all details
    const productList = await db.select().from(products).limit(3);
    console.log('Sample products:', productList);
    
    // Also check database connection
    const connectionTest = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection test:', connectionTest);
    
    return NextResponse.json({
      success: true,
      totalProducts: totalResult.count,
      sampleProducts: productList,
      connectionTest: connectionTest
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
