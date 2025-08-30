import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: Array<{
      id: string;
      price?: string;
      stockStatus?: string;
      sku?: string;
    }> = body?.updates || [];
    for (const u of updates) {
      await db
        .update(productVariants)
        .set({
          price: u.price ?? undefined,
          stockStatus: u.stockStatus ?? undefined,
          sku: u.sku ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, u.id));
    }
    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error('bulk update variants error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
