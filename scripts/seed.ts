import { db } from '@/db';
import { products, productVariants, brands, categories, productBrands, productCategories } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Seed script for generating realistic product data for testing
 * Run with: npm run seed
 */

const SAMPLE_BRANDS = [
  'Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'Canon', 'Dell', 'HP', 
  'Lenovo', 'Microsoft', 'Google', 'Amazon', 'Zara', 'H&M', 'Uniqlo'
];

const SAMPLE_CATEGORIES = [
  { name: 'Electronics', parent: null },
  { name: 'Smartphones', parent: 'Electronics' },
  { name: 'Laptops', parent: 'Electronics' },
  { name: 'Cameras', parent: 'Electronics' },
  { name: 'Clothing', parent: null },
  { name: 'Men\'s Clothing', parent: 'Clothing' },
  { name: 'Women\'s Clothing', parent: 'Clothing' },
  { name: 'Shoes', parent: null },
  { name: 'Running Shoes', parent: 'Shoes' },
  { name: 'Casual Shoes', parent: 'Shoes' },
  { name: 'Books', parent: null },
  { name: 'Fiction', parent: 'Books' },
  { name: 'Non-Fiction', parent: 'Books' },
];

const PRODUCT_TYPES = ['simple', 'variable', 'grouped'] as const;
const PRODUCT_STATUSES = ['published', 'draft', 'private'] as const;

const SAMPLE_PRODUCTS = [
  { name: 'iPhone 15 Pro', description: 'Latest iPhone with Pro features', basePrice: 999.99, type: 'variable' },
  { name: 'MacBook Pro 14"', description: 'Professional laptop for creators', basePrice: 1999.99, type: 'variable' },
  { name: 'Nike Air Max 90', description: 'Classic running shoes', basePrice: 129.99, type: 'variable' },
  { name: 'Samsung Galaxy S24', description: 'Flagship Android smartphone', basePrice: 899.99, type: 'variable' },
  { name: 'Dell XPS 13', description: 'Ultrabook laptop', basePrice: 1299.99, type: 'variable' },
  { name: 'Canon EOS R5', description: 'Professional mirrorless camera', basePrice: 3899.99, type: 'simple' },
  { name: 'Sony WH-1000XM5', description: 'Noise-canceling headphones', basePrice: 399.99, type: 'simple' },
  { name: 'Adidas Ultraboost 22', description: 'Performance running shoes', basePrice: 189.99, type: 'variable' },
  { name: 'Zara Basic T-Shirt', description: 'Cotton blend basic tee', basePrice: 19.99, type: 'variable' },
  { name: 'H&M Denim Jeans', description: 'Classic fit denim', basePrice: 39.99, type: 'variable' },
];

const VARIANT_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Gold', 'Silver'];
const VARIANT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const VARIANT_STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB'];

function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateSKU(baseName: string, variant?: Record<string, string>): string {
  const base = baseName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  if (!variant) return `${base}-${randomSuffix}`;
  
  const variantCode = Object.values(variant)
    .map(v => v.slice(0, 3).toUpperCase())
    .join('');
  
  return `${base}-${variantCode}-${randomSuffix}`;
}

async function seedBrands() {
  console.log('Seeding brands...');
  
  const brandInserts = SAMPLE_BRANDS.map(name => ({ name }));
  
  await db.insert(brands)
    .values(brandInserts)
    .onConflictDoNothing();
    
  console.log(`✓ Seeded ${SAMPLE_BRANDS.length} brands`);
}

async function seedCategories() {
  console.log('Seeding categories...');
  
  // First, insert root categories
  const rootCategories = SAMPLE_CATEGORIES.filter(cat => !cat.parent);
  await db.insert(categories)
    .values(rootCategories.map(cat => ({ name: cat.name, parentId: null })))
    .onConflictDoNothing();
  
  // Get all categories with IDs
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));
  
  // Insert child categories
  const childCategories = SAMPLE_CATEGORIES.filter(cat => cat.parent);
  for (const cat of childCategories) {
    const parentId = categoryMap.get(cat.parent!);
    if (parentId) {
      await db.insert(categories)
        .values({ name: cat.name, parentId })
        .onConflictDoNothing();
    }
  }
  
  console.log(`✓ Seeded ${SAMPLE_CATEGORIES.length} categories`);
}

async function seedProducts() {
  console.log('Seeding products...');
  
  // Get all brands and categories for random assignment
  const allBrands = await db.select().from(brands);
  const allCategories = await db.select().from(categories);
  
  let productCount = 0;
  let totalVariantCount = 0;
  
  // Generate products based on samples and random variations
  for (let i = 0; i < 200; i++) {
    const sample = randomChoice(SAMPLE_PRODUCTS);
    const suffix = i > SAMPLE_PRODUCTS.length - 1 ? ` ${Math.floor(i / SAMPLE_PRODUCTS.length) + 1}` : '';
    
    const product = {
      sku: generateSKU(sample.name + suffix),
      name: sample.name + suffix,
      description: sample.description,
      basePrice: sample.basePrice.toString(),
      status: randomChoice(PRODUCT_STATUSES),
      type: sample.type as 'simple' | 'variable' | 'grouped',
    };
    
    // Insert product
    const [insertedProduct] = await db.insert(products)
      .values(product)
      .returning({ id: products.id });
    
    productCount++;
    
    // Assign random brands (1-2 per product)
    const productBrandIds = randomChoices(allBrands, Math.random() > 0.7 ? 2 : 1);
    for (const brand of productBrandIds) {
      await db.insert(productBrands)
        .values({
          productId: insertedProduct.id,
          brandId: brand.id,
        })
        .onConflictDoNothing();
    }
    
    // Assign random categories (1-3 per product)
    const productCategoryIds = randomChoices(allCategories, Math.floor(Math.random() * 3) + 1);
    for (const category of productCategoryIds) {
      await db.insert(productCategories)
        .values({
          productId: insertedProduct.id,
          categoryId: category.id,
        })
        .onConflictDoNothing();
    }
    
    // Generate variants for variable products
    if (product.type === 'variable') {
      const variantCount = Math.floor(Math.random() * 8) + 2; // 2-10 variants
      
      for (let v = 0; v < variantCount; v++) {
        const attributes: Record<string, string> = {};
        
        // Add random attributes based on product type
        if (sample.name.includes('iPhone') || sample.name.includes('Samsung')) {
          attributes.color = randomChoice(VARIANT_COLORS);
          attributes.storage = randomChoice(VARIANT_STORAGES);
        } else if (sample.name.includes('Shoes') || sample.name.includes('T-Shirt') || sample.name.includes('Jeans')) {
          attributes.color = randomChoice(VARIANT_COLORS);
          attributes.size = randomChoice(VARIANT_SIZES);
        } else {
          attributes.color = randomChoice(VARIANT_COLORS);
          if (Math.random() > 0.5) {
            attributes.size = randomChoice(['Small', 'Medium', 'Large']);
          }
        }
        
        await db.insert(productVariants)
          .values({
            productId: insertedProduct.id,
            sku: generateSKU(product.name, attributes),
            attributes: JSON.stringify(attributes),
          });
        
        totalVariantCount++;
      }
    } else {
      // Simple products get one default variant
      await db.insert(productVariants)
        .values({
          productId: insertedProduct.id,
          sku: product.sku + '-DEFAULT',
          attributes: '{}',
        });
      
      totalVariantCount++;
    }
    
    // Log progress
    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/200 products`);
    }
  }
  
  console.log(`✓ Seeded ${productCount} products with ${totalVariantCount} variants`);
}

async function updateProductTimestamps() {
  console.log('Updating product timestamps for realistic pagination testing...');
  
  // Update products with spread-out timestamps over the last 30 days
  await db.execute(sql`
    UPDATE products 
    SET updated_at = NOW() - (RANDOM() * INTERVAL '30 days'),
        created_at = NOW() - (RANDOM() * INTERVAL '60 days')
  `);
  
  console.log('✓ Updated product timestamps');
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedBrands();
    await seedCategories();
    await seedProducts();
    await updateProductTimestamps();
    
    console.log('✅ Database seeding completed successfully!');
    
    // Print summary
    const stats = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM products`),
      db.execute(sql`SELECT COUNT(*) as count FROM product_variants`),
      db.execute(sql`SELECT COUNT(*) as count FROM brands`),
      db.execute(sql`SELECT COUNT(*) as count FROM categories`),
    ]);
    
    console.log('\n📊 Database Summary:');
    console.log(`  Products: ${stats[0][0]?.count || 0}`);
    console.log(`  Variants: ${stats[1][0]?.count || 0}`);
    console.log(`  Brands: ${stats[2][0]?.count || 0}`);
    console.log(`  Categories: ${stats[3][0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as seedDatabase };
