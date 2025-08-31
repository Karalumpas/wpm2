import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shopBuilds } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await db.select().from(shopBuilds).where(eq(shopBuilds.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ build: rows[0] });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(shopBuilds)
    .set({
      name: body.name,
      slug: body.slug,
      currency: body.currency,
      inventoryPolicy: body.inventoryPolicy,
      sourceShopId: body.sourceShopId || null,
      config: body.config,
      updatedAt: new Date(),
    })
    .where(eq(shopBuilds.id, id))
    .returning();
  return NextResponse.json({ build: row });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.delete(shopBuilds).where(eq(shopBuilds.id, id));
  return NextResponse.json({ success: true });
}

