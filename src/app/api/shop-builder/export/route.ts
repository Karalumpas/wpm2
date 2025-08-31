import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cfg = await request.json();
    // Echo back with a small header for future compatibility
    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      config: cfg,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

