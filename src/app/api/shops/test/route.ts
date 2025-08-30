import { NextRequest, NextResponse } from 'next/server';
import { createShopSchema } from '@/lib/validation/shops';
import { WooCommerceClient } from '@/lib/woo/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const shopData = createShopSchema.parse(body);

    // Test connection
    const client = new WooCommerceClient({
      baseUrl: shopData.url,
      consumerKey: shopData.consumerKey,
      consumerSecret: shopData.consumerSecret,
    });

    const result = await client.testConnection();

    return NextResponse.json({
      success: result.reachable && result.auth,
      reachable: result.reachable,
      auth: result.auth,
      details: result.details,
      error: result.details.error,
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      },
      { status: 500 }
    );
  }
}
