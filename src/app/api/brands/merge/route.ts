import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brands, productBrands } from '@/db/schema';
import { inArray, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { sourceIds, targetId } = await request.json();
    if (!Array.isArray(sourceIds) || !targetId || sourceIds.length === 0) {
      return NextResponse.json({ error: 'sourceIds[] and targetId are required' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO product_brands (product_id, brand_id)
      SELECT product_id, ${targetId}::uuid FROM product_brands WHERE brand_id = ANY(${sourceIds}::uuid[])
      ON CONFLICT (product_id, brand_id) DO NOTHING
    `);
    await db.execute(sql`DELETE FROM product_brands WHERE brand_id = ANY(${sourceIds}::uuid[])`);
    await db.delete(brands).where(inArray(brands.id, sourceIds));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
