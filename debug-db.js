// Debug database insertion
import { db } from './src/db/index.js';
import { products } from './src/db/schema.js';

async function testInsert() {
  try {
    console.log('Testing database insert...');
    
    const result = await db.insert(products).values({
      wooCommerceId: 'test-123',
      shopId: '8ec67629-007a-4007-a3b7-866c2c24b4b0',
      sku: 'TEST-SKU',
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      shortDescription: 'Test short',
      basePrice: '10.00',
      regularPrice: '10.00',
      status: 'published',
      type: 'simple',
      manageStock: false,
      stockStatus: 'instock',
      dimensions: {},
      wooCommerceData: {},
      galleryImages: [],
      lastSyncedAt: new Date(),
    }).returning({ id: products.id });
    
    console.log('Insert successful:', result);
    
    // Clean up
    await db.delete(products).where({ id: result[0].id });
    console.log('Cleanup successful');
    
  } catch (error) {
    console.error('Insert failed:', error);
  }
}

testInsert();
