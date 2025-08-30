import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get the latest 10 products with their image information
    const latestProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        featuredImage: products.featuredImage,
        galleryImages: products.galleryImages,
        shopId: products.shopId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .orderBy(desc(products.updatedAt))
      .limit(10);

    const imageAnalysis = latestProducts.map((product) => {
      const featuredImageType = product.featuredImage
        ? product.featuredImage.includes('localhost:9000')
          ? 'MinIO (Local)'
          : 'External'
        : 'None';

      const galleryImagesArray = Array.isArray(product.galleryImages)
        ? product.galleryImages
        : [];
      const galleryImageTypes = galleryImagesArray.map((url: string) =>
        url.includes('localhost:9000') ? 'MinIO (Local)' : 'External'
      );

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        shopId: product.shopId,
        featuredImage: {
          url: product.featuredImage,
          type: featuredImageType,
        },
        galleryImages: {
          count: galleryImagesArray.length,
          types: galleryImageTypes,
          urls: galleryImagesArray,
        },
        updatedAt: product.updatedAt,
      };
    });

    // Count image types
    const totalProducts = latestProducts.length;
    const productsWithMinIOImages = imageAnalysis.filter(
      (p) =>
        p.featuredImage.type === 'MinIO (Local)' ||
        p.galleryImages.types.some((type: string) => type === 'MinIO (Local)')
    ).length;
    const productsWithExternalImages = imageAnalysis.filter(
      (p) =>
        p.featuredImage.type === 'External' ||
        p.galleryImages.types.some((type: string) => type === 'External')
    ).length;

    return NextResponse.json({
      summary: {
        totalProducts,
        productsWithMinIOImages,
        productsWithExternalImages,
        syncedPercentage: Math.round(
          (productsWithMinIOImages / totalProducts) * 100
        ),
      },
      latestProducts: imageAnalysis,
      message: 'Image analysis for latest products',
      minioUrl: 'http://localhost:9001',
      instructions: {
        'If all images are External':
          'Images are still pointing to original webshops. Run image sync to download them to MinIO.',
        'If some images are MinIO (Local)':
          'Image sync is working! Some products have been synced.',
        'Check MinIO Browser':
          'Go to http://localhost:9001 (minioadmin/minioadmin) to see uploaded files in product-images bucket.',
      },
    });
  } catch (error) {
    console.error('❌ Failed to analyze product images:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
