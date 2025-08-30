import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = body?.ids || [];
    // TODO: Integrate with WooCommerce media/product export flow.
    // For now, acknowledge request so UI flows work.
    return NextResponse.json({ success: true, queued: ids.length });
  } catch (error) {
    console.error('bulk export variants error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
