import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { decryptFromCompact } from '@/lib/security/crypto';
import { WooCommerceClient } from '@/lib/woo/client';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    console.log('Starting connection test for shop:', id);
    
    // Skip authentication for now - use direct shop lookup
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get shop (without userId check for now)
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);

    if (!shop) {
      console.log('Shop not found:', id);
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    console.log('Shop found:', shop.name, shop.url);

    // Check if credentials exist
    if (!shop.consumerKeyEnc || !shop.consumerSecretEnc) {
      console.log('Missing credentials for shop:', id);
      return NextResponse.json({ 
        success: false,
        error: 'Shop credentials not configured. Please edit the shop and add your WooCommerce API credentials.',
        details: {
          reachable: false,
          auth: false,
          productsOk: false,
          elapsedMs: 0
        }
      });
    }

    // Decrypt credentials
    let consumerKey, consumerSecret;
    try {
      consumerKey = decryptFromCompact(shop.consumerKeyEnc);
      consumerSecret = decryptFromCompact(shop.consumerSecretEnc);
      console.log('Credentials decrypted successfully');
    } catch (decryptError) {
      console.error('Failed to decrypt credentials:', decryptError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to decrypt shop credentials. Please re-enter your API credentials.',
        details: {
          reachable: false,
          auth: false,
          productsOk: false,
          elapsedMs: 0
        }
      });
    }

    // Test connection
    console.log('Testing connection to:', shop.url);
    const client = new WooCommerceClient({
      baseUrl: shop.url,
      consumerKey,
      consumerSecret,
    });

    const testResult = await client.testConnection();
    console.log('Test result:', testResult);

    // Update shop with test results
    await db
      .update(shops)
      .set({
        lastConnectionOk: testResult.auth,
        lastConnectionCheckAt: new Date(),
        status: testResult.auth ? 'active' : 'error',
      })
      .where(eq(shops.id, id));

    // Return wrapped result in expected format
    return NextResponse.json({
      success: testResult.auth,
      error: testResult.details.error || (testResult.auth ? null : 'Connection or authentication failed'),
      details: {
        reachable: testResult.reachable,
        auth: testResult.auth,
        productsOk: testResult.details.productsOk || false,
        elapsedMs: testResult.details.elapsedMs
      }
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    
    // Create detailed error message
    let errorMessage = 'Connection test failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Update shop with error status
    try {
      await db
        .update(shops)
        .set({
          lastConnectionOk: false,
          lastConnectionCheckAt: new Date(),
          status: 'error',
        })
        .where(eq(shops.id, id));
    } catch (updateError) {
      console.error('Error updating shop status:', updateError);
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        reachable: false,
        auth: false,
        productsOk: false,
        elapsedMs: 0
      }
    });
  }
}
