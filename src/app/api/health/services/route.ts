import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/storage/minio';
import { photoPrismClient } from '@/lib/storage/photoprism';

export async function GET(_request: NextRequest) {
  const services: { [key: string]: { status: string; error: string | null } } = {
    minio: { status: 'unknown', error: null },
    photoprism: { status: 'unknown', error: null },
  };

  // Test MinIO connection
  try {
    await minioClient.listBuckets();
    services.minio.status = 'ok';
  } catch (error) {
    services.minio.status = 'error';
    services.minio.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Test PhotoPrism connection
  try {
    await photoPrismClient.searchPhotos('', 1);
    services.photoprism.status = 'ok';
  } catch (error) {
    services.photoprism.status = 'error';
    services.photoprism.error = error instanceof Error ? error.message : 'Unknown error';
  }

  const overallStatus = Object.values(services).every(service => service.status === 'ok') ? 'ok' : 'partial';

  return NextResponse.json({
    status: overallStatus,
    services,
    timestamp: new Date().toISOString(),
  });
}