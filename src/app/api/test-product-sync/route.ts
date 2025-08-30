import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { WooCommerceClient } from '@/lib/woo/client';
import type { WooCommerceProduct } from '@/lib/woo/types';
import { WooCommerceProductSyncService } from '@/lib/woo/sync-service';
import { decryptFromCompact } from '@/lib/security/crypto';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, productLimit = 5 } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing product sync with image sync for shop: ${shopId}`);

    // Get shop from database
    const shop = await db
      .select()
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);

    if (shop.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    const shopData = shop[0];

    // Decrypt credentials
    const consumerKey = decryptFromCompact(shopData.consumerKeyEnc);
    const consumerSecret = decryptFromCompact(shopData.consumerSecretEnc);

    // Create WooCommerce client
    const client = new WooCommerceClient({
      baseUrl: shopData.url,
      consumerKey,
      consumerSecret,
    });

    // Test connection first
    const connectionTest = await client.testConnection();
    if (!connectionTest.auth) {
      return NextResponse.json(
        { success: false, error: 'WooCommerce API authentication failed' },
        { status: 401 }
      );
    }

    // Get a few products for testing
    console.log(`📦 Fetching ${productLimit} products from WooCommerce...`);
    const products = (await client.get(
      `/products?per_page=${productLimit}&status=publish`
    )) as WooCommerceProduct[];

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products found in WooCommerce' },
        { status: 404 }
      );
    }

    console.log(
      `✅ Found ${products.length} products, starting sync with images...`
    );

    // Create sync service
    const syncService = new WooCommerceProductSyncService(shopId, client);

    // Set up progress tracking
    const progressLog: string[] = [];
    syncService.setProgressCallback((progress) => {
      const logMessage = `[${progress.stage}] ${progress.current}/${progress.total} - ${progress.message}`;
      console.log(logMessage);
      progressLog.push(logMessage);
    });

    // Run sync
    const syncResult = await syncService.syncAll();

    console.log(`🎉 Sync completed:`, syncResult);

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      syncDetails: syncResult.details,
      productsFound: products.length,
      progressLog: progressLog.slice(-20), // Last 20 progress messages
      testProducts: products.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        images: p.images?.length || 0,
        featuredImage: p.images?.[0]?.src || null,
      })),
    });
  } catch (error) {
    console.error('❌ Product sync test failed:', error);

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
  try {
    // List available shops
    const availableShops = await db
      .select({
        id: shops.id,
        name: shops.name,
        url: shops.url,
        status: shops.status,
      })
      .from(shops);

    return NextResponse.json({
      message: 'Product sync test endpoint',
      usage: 'POST with { "shopId": "shop-id", "productLimit": 5 }',
      availableShops,
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Product sync test endpoint',
      usage: 'POST with { "shopId": "shop-id", "productLimit": 5 }',
      error: 'Could not load shops',
    });
  }
}
