import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status: 'ok',
      version: process.env.npm_package_version || '0.1.0',
      db: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        version: process.env.npm_package_version || '0.1.0',
        db: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
