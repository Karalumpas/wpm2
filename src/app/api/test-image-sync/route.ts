import { NextRequest, NextResponse } from 'next/server';
import { imageSyncService } from '@/lib/image-sync/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, shopId = 'test-shop' } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing image sync for URL: ${imageUrl}`);

    // Initialize MinIO bucket first
    await imageSyncService.initializeBucket();
    console.log('✅ MinIO bucket initialized');

    // Download image to MinIO
    const syncedImage = await imageSyncService.downloadImageToMinIO(
      imageUrl,
      shopId
    );

    if (!syncedImage) {
      return NextResponse.json(
        { success: false, error: 'Failed to sync image' },
        { status: 500 }
      );
    }

    console.log(`✅ Image synced successfully: ${syncedImage.centralUrl}`);

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      syncedImage: {
        centralUrl: syncedImage.centralUrl,
        minioPath: syncedImage.minioPath,
        fileName: syncedImage.fileName,
        shopId: syncedImage.shopId,
        syncedAt: syncedImage.syncedAt,
      },
      message: 'Image synced successfully to MinIO',
    });
  } catch (error) {
    console.error('❌ Image sync test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Image sync test endpoint',
    usage:
      'POST with { "imageUrl": "https://example.com/image.jpg", "shopId": "optional-shop-id" }',
  });
}
