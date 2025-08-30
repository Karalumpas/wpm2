import { NextRequest, NextResponse } from 'next/server';
import { fixMissingContentTypes } from '@/lib/storage/minio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const prefix = typeof body?.prefix === 'string' ? body.prefix : undefined;

    const result = await fixMissingContentTypes(prefix);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Failed to fix MinIO content types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix content types' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      'POST to this endpoint to scan MinIO and fix missing/invalid content-types for image objects. Optional body: { "prefix": "shops/<shopId>/" }',
  });
}

