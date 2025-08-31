import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shopBuilds } from '@/db/schema';
import { and, eq, ilike, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get('q') || undefined;
  try {
    const where = [] as any[];
    if (q) where.push(ilike(shopBuilds.name, `%${q}%`));
    const rows = await db
      .select({
        id: shopBuilds.id,
        name: shopBuilds.name,
        slug: shopBuilds.slug,
        updatedAt: shopBuilds.updatedAt,
      })
      .from(shopBuilds)
      .where(where.length ? and(...where) : undefined as any)
      .orderBy(shopBuilds.updatedAt)
      .limit(200);
    return NextResponse.json({ builds: rows });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list builds' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [row] = await db
      .insert(shopBuilds)
      .values({
        name: String(body.name || 'Untitled Build'),
        slug: String(body.slug || 'untitled'),
        currency: String(body.currency || 'DKK'),
        inventoryPolicy: String(body.inventoryPolicy || 'snapshot'),
        sourceShopId: body.sourceShopId || null,
        config: body.config || {},
      })
      .returning();
    return NextResponse.json({ build: row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create build' }, { status: 400 });
  }
}

