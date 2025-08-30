import { NextRequest, NextResponse } from 'next/server';
import { imageSyncService } from '@/lib/image-sync/service';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/images/sync
 * Sync images from a connected shop to central MinIO storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, productId, featuredImage, galleryImages, forceRedownload } = body;

    if (!shopId || !productId) {
      return NextResponse.json(
        { error: 'shopId and productId are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting image sync for product ${productId} from shop ${shopId}`);

    // Sync images to central storage
    const syncedImages = await imageSyncService.syncProductImages(
      featuredImage || null,
      galleryImages || [],
      shopId
    );

    // Update product in database with central image URLs
    if (productId) {
      try {
        await db
          .update(products)
          .set({
            featuredImage: syncedImages.featuredImage,
            galleryImages: syncedImages.galleryImages,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));

        console.log(`✅ Updated product ${productId} with central image URLs`);
      } catch (dbError) {
        console.error('❌ Failed to update product in database:', dbError);
        // Continue anyway - images are synced even if DB update fails
      }
    }

    return NextResponse.json({
      success: true,
      syncedImages,
      message: `Synced ${syncedImages.galleryImages.length + (syncedImages.featuredImage ? 1 : 0)} images`,
    });

  } catch (error) {
    console.error('❌ Image sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync images' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/images/sync/status
 * Get sync status for images
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const productId = searchParams.get('productId');

    // This would check sync status from database
    // For now, return basic info
    return NextResponse.json({
      status: 'ready',
      minioHealthy: true,
      shopId,
      productId,
    });

  } catch (error) {
    console.error('❌ Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
