import { db } from '@/db';
import { products } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function checkProducts() {
  try {
    console.log('Checking products in database...');

    // Count total products
    const productCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products);
    console.log(`Total products: ${productCount[0].count}`);

    // Get first 5 products
    const sampleProducts = await db.select().from(products).limit(5);
    console.log('\nSample products:');
    sampleProducts.forEach((product, index) => {
      console.log(
        `${index + 1}. ${product.name} (${product.sku}) - ${product.status}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking products:', error);
    process.exit(1);
  }
}

checkProducts();
