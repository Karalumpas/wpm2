import { NextResponse } from 'next/server';
import { ensurePublicReadPolicy, initializeMinIO } from '@/lib/storage/minio';

export async function POST() {
  try {
    await initializeMinIO();
    await ensurePublicReadPolicy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to ensure public MinIO policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set public policy' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST to apply public read policy to MinIO bucket.' });
}

