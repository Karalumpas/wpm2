import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { productVariants } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = body?.ids || [];
    if (!ids.length) return NextResponse.json({ success: true, updated: 0 });
    const now = new Date();
    await db
      .update(productVariants)
      .set({ updatedAt: now, lastSyncedAt: now })
      .where(inArray(productVariants.id, ids));
    // NOTE: Hook to Woo sync-service can be added here per product if needed
    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error('bulk sync variants error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
