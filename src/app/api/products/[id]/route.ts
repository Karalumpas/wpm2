import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [p] = await db
      .select()
      .from(products)
      .where(eq(products.id, params.id))
      .limit(1);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (error) {
    console.error('GET product error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await db
      .update(products)
      .set({
        sku: body.sku ?? undefined,
        name: body.name ?? undefined,
        slug: body.slug ?? undefined,
        description: body.description ?? undefined,
        shortDescription: body.shortDescription ?? undefined,
        basePrice: body.basePrice ?? null,
        regularPrice: body.regularPrice ?? null,
        salePrice: body.salePrice ?? null,
        status: body.status ?? undefined,
        type: body.type ?? undefined,
        stockStatus: body.stockStatus ?? undefined,
        dimensions: body.dimensions ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT product error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
