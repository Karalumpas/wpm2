import { NextRequest, NextResponse } from 'next/server';
import { imageSyncService } from '@/lib/image-sync/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      featuredImageUrl,
      galleryImageUrls = [],
      shopId = 'test-shop',
    } = body;

    if (
      !featuredImageUrl &&
      (!galleryImageUrls || galleryImageUrls.length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least featuredImageUrl or galleryImageUrls is required',
        },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing product image sync for shop: ${shopId}`);
    console.log(`📷 Featured image: ${featuredImageUrl}`);
    console.log(`🖼️ Gallery images: ${galleryImageUrls.length} items`);

    // Initialize MinIO bucket first
    await imageSyncService.initializeBucket();
    console.log('✅ MinIO bucket initialized');

    // Sync product images
    const syncedImages = await imageSyncService.syncProductImages(
      featuredImageUrl,
      galleryImageUrls,
      shopId
    );

    console.log(`✅ Product images synced successfully:`);
    console.log(`   Featured: ${syncedImages.featuredImage}`);
    console.log(`   Gallery: ${syncedImages.galleryImages.length} images`);

    return NextResponse.json({
      success: true,
      originalImages: {
        featuredImage: featuredImageUrl,
        galleryImages: galleryImageUrls,
      },
      syncedImages: {
        featuredImage: syncedImages.featuredImage,
        galleryImages: syncedImages.galleryImages,
      },
      shopId,
      message: `Successfully synced ${(syncedImages.featuredImage ? 1 : 0) + syncedImages.galleryImages.length} images`,
    });
  } catch (error) {
    console.error('❌ Product image sync test failed:', error);

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
    message: 'Product image sync test endpoint',
    usage:
      'POST with { "featuredImageUrl": "https://example.com/featured.jpg", "galleryImageUrls": ["https://example.com/img1.jpg"], "shopId": "optional-shop-id" }',
  });
}
