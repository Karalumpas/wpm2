import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, productCategories } from '@/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { sourceIds, targetId } = await request.json();
    if (!Array.isArray(sourceIds) || !targetId || sourceIds.length === 0) {
      return NextResponse.json({ error: 'sourceIds[] and targetId are required' }, { status: 400 });
    }

    // Move product associations
    await db.execute(sql`
      INSERT INTO product_categories (product_id, category_id)
      SELECT product_id, ${targetId}::uuid FROM product_categories WHERE category_id = ANY(${sourceIds}::uuid[])
      ON CONFLICT (product_id, category_id) DO NOTHING
    `);
    await db.execute(sql`DELETE FROM product_categories WHERE category_id = ANY(${sourceIds}::uuid[])`);

    // Reparent children of sources to target
    await db
      .update(categories)
      .set({ parentId: targetId })
      .where(inArray(categories.parentId, sourceIds));

    // Delete source categories
    await db.delete(categories).where(inArray(categories.id, sourceIds));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
