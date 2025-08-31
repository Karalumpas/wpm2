import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shopId: string | undefined = body?.targetShopId;
    const config = body?.config;
    if (!shopId || !config)
      return NextResponse.json(
        { error: 'targetShopId and config required' },
        { status: 400 }
      );

    const s = await db
      .select()
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);
    if (!s.length)
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const productCount = (config.products || []).length;
    const categoryCount = (config.categories || []).length;
    const tagsCount = (config.tags || []).length;

    // Placeholder validation: in a real implementation we would test auth and quota
    const checks = {
      connectionReachable: true,
      authOk: true,
      estimatedApiCalls: productCount + categoryCount + tagsCount,
    };

    return NextResponse.json({
      ok: true,
      checks,
      summary: { productCount, categoryCount, tagsCount },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
