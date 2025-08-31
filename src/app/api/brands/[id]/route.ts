import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brands, productBrands } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { updateBrandSchema } from '@/lib/validation/brands';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateBrandSchema.parse(body);

    if (data.name) {
      // Unique name
      const exists = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.name, data.name))
        .limit(1);
      if (exists.length && exists[0].id !== id) {
        return NextResponse.json(
          { error: 'A brand with this name already exists.' },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(brands)
      .set({ name: data.name })
      .where(eq(brands.id, id))
      .returning();

    return NextResponse.json({ success: true, brand: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    let moveToBrandId: string | undefined;
    try {
      const body = await request.json();
      moveToBrandId = body?.moveToBrandId;
    } catch {}

    // If used by products, either move to target or block
    const refs = await db
      .select({ c: sql<number>`count(*)` })
      .from(productBrands)
      .where(eq(productBrands.brandId, id));
    const countUsed = Number(refs[0]?.c || 0);
    if (countUsed > 0 && !moveToBrandId) {
      return NextResponse.json(
        {
          error: `Brand used by ${countUsed} products. Provide moveToBrandId to migrate products before delete.`,
        },
        { status: 400 }
      );
    }
    if (countUsed > 0 && moveToBrandId) {
      await db.execute(sql`
        INSERT INTO product_brands (product_id, brand_id)
        SELECT product_id, ${moveToBrandId}::uuid FROM product_brands WHERE brand_id = ${id}::uuid
        ON CONFLICT (product_id, brand_id) DO NOTHING
      `);
      await db.execute(
        sql`DELETE FROM product_brands WHERE brand_id = ${id}::uuid`
      );
    }

    await db.delete(brands).where(eq(brands.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
