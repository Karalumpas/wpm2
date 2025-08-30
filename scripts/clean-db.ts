/**
 * Clean Database Script
 * 
 * Dette script rydder op i databasen for at genstarte med friske data
 */

import postgres from 'postgres';

const connectionString = 'postgresql://postgres:postgresPW@192.168.0.180:5432/wpm2';

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('\n1. Deleting product data...');
    
    // Delete in correct order due to foreign key constraints
    await sql`DELETE FROM product_categories`;
    await sql`DELETE FROM product_brands`;
    await sql`DELETE FROM product_variants`;
    await sql`DELETE FROM products`;
    await sql`DELETE FROM categories`;
    await sql`DELETE FROM brands`;
    
    console.log('✅ Product data deleted');

    console.log('\n2. Verifying cleanup...');
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM brands) as brands,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM product_variants) as variants,
        (SELECT COUNT(*) FROM product_brands) as product_brands,
        (SELECT COUNT(*) FROM product_categories) as product_categories
    `;
    
    const count = counts[0] as any;
    console.log(`   Products: ${count.products}`);
    console.log(`   Brands: ${count.brands}`);
    console.log(`   Categories: ${count.categories}`);
    console.log(`   Variants: ${count.variants}`);
    console.log(`   Product-Brands: ${count.product_brands}`);
    console.log(`   Product-Categories: ${count.product_categories}`);

    await sql.end();
    console.log('\n🎉 Database cleaned successfully!');
    
  } catch (error) {
    console.error('\n❌ Failed to clean database!');
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

cleanDatabase();
