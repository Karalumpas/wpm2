import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woo/client';

export async function GET(request: NextRequest) {
  try {
    // Create client for mgwp shop
    const client = new WooCommerceClient({
      baseUrl: 'https://mgwp.medeland.dk',
      consumerKey: 'ck_fe3f97b0d1bb93c0fd95dec8a0d5d5b94893ddf6',
      consumerSecret: 'cs_e0ba8b32ad14976fb482ce6e07c4bb8b38de2f24',
    });

    const results: {
      baseInfo: Record<string, any>;
      endpoints: Record<string, any>;
      errors: Record<string, any>;
    } = {
      baseInfo: {},
      endpoints: {},
      errors: {}
    };

    // Test basic connection
    try {
      const siteInfo = await client.get('/system_status');
      results.baseInfo = { siteInfo: 'Connected successfully' };
    } catch (error) {
      results.errors.siteInfo = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test products endpoint
    try {
      const products = await client.get('/products?per_page=1');
      results.endpoints.products = { count: Array.isArray(products) ? products.length : 'Not array', data: products };
    } catch (error) {
      results.errors.products = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test categories endpoint
    try {
      const categories = await client.get('/products/categories?per_page=1');
      results.endpoints.categories = { count: Array.isArray(categories) ? categories.length : 'Not array', data: categories };
    } catch (error) {
      results.errors.categories = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test alternative categories endpoint
    try {
      const altCategories = await client.get('/product/categories?per_page=1');
      results.endpoints.altCategories = { count: Array.isArray(altCategories) ? altCategories.length : 'Not array', data: altCategories };
    } catch (error) {
      results.errors.altCategories = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      message: 'WooCommerce API endpoint test completed',
      results
    });

  } catch (error) {
    console.error('WooCommerce test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test WooCommerce endpoints',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
