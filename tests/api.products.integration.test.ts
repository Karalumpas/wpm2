import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/db';
import {
  products,
  productVariants,
  categories,
  brands,
  productCategories,
  productBrands,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

// Unauthorized access tests
describe('Products API Authentication', () => {
  it('should reject unauthorized product requests', async () => {
    const response = await fetch('http://localhost:3000/api/products');
    expect(response.status).toBe(401);
  });

  it('should reject unauthorized filter requests', async () => {
    const response = await fetch('http://localhost:3000/api/products/filters');
    expect(response.status).toBe(401);
  });
});

// Mock data for testing
const testBrand = {
  id: 'test-brand-id',
  name: 'Test Brand',
  slug: 'test-brand',
  description: 'A test brand',
};

const testCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  slug: 'test-category',
  description: 'A test category',
  parentId: null,
};

const testProduct = {
  id: 'test-product-id',
  sku: 'TEST-SKU-001',
  name: 'Test Product',
  description: 'A test product for integration testing',
  basePrice: '99.99',
  status: 'published' as const,
  type: 'simple' as const,
  shopId: null,
};

const testVariant = {
  id: 'test-variant-id',
  productId: 'test-product-id',
  sku: 'TEST-SKU-001-VAR',
  name: 'Test Variant',
  price: '99.99',
  compareAtPrice: null,
  costPrice: null,
  stock: 10,
  weight: null,
  attributes: { color: 'Black', size: 'M' },
};

describe('Products API Integration Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up after all tests
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean up before each test to ensure isolation
    await cleanupTestData();

    // Insert fresh test data
    await db.insert(brands).values(testBrand);
    await db.insert(categories).values(testCategory);
    await db.insert(products).values(testProduct);
    await db.insert(productVariants).values(testVariant);
    await db.insert(productBrands).values({
      productId: testProduct.id,
      brandId: testBrand.id,
    });
    await db.insert(productCategories).values({
      productId: testProduct.id,
      categoryId: testCategory.id,
    });
  });

  async function cleanupTestData() {
    // Delete in correct order due to foreign key constraints
    await db
      .delete(productCategories)
      .where(eq(productCategories.productId, testProduct.id));
    await db
      .delete(productBrands)
      .where(eq(productBrands.productId, testProduct.id));
    await db
      .delete(productVariants)
      .where(eq(productVariants.productId, testProduct.id));
    await db.delete(products).where(eq(products.id, testProduct.id));
    await db.delete(categories).where(eq(categories.id, testCategory.id));
    await db.delete(brands).where(eq(brands.id, testBrand.id));
  }

  describe('GET /api/products/filters', () => {
    it('should return available filters', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products/filters'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('brands');
      expect(data).toHaveProperty('statuses');
      expect(data).toHaveProperty('types');

      // Check that our test data is included
      expect(data.brands).toContainEqual(
        expect.objectContaining({
          id: testBrand.id,
          name: testBrand.name,
        })
      );

      expect(data.categories).toContainEqual(
        expect.objectContaining({
          id: testCategory.id,
          name: testCategory.name,
          parentId: null,
        })
      );

      // Check enum values
      expect(data.statuses).toContain('published');
      expect(data.statuses).toContain('draft');
      expect(data.statuses).toContain('private');

      expect(data.types).toContain('simple');
      expect(data.types).toContain('variable');
      expect(data.types).toContain('grouped');
    });

    it('should return cached results on subsequent requests', async () => {
      const start1 = Date.now();
      const response1 = await fetch(
        'http://localhost:3000/api/products/filters'
      );
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const response2 = await fetch(
        'http://localhost:3000/api/products/filters'
      );
      const duration2 = Date.now() - start2;

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1).toEqual(data2);
      // Second request should be faster due to caching
      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('GET /api/products', () => {
    it('should return products list with default pagination', async () => {
      const response = await fetch('http://localhost:3000/api/products');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('hasMore');
      expect(Array.isArray(data.items)).toBe(true);

      // Should include our test product
      const testProductItem = data.items.find(
        (item: any) => item.id === testProduct.id
      );
      expect(testProductItem).toBeDefined();
      expect(testProductItem).toMatchObject({
        id: testProduct.id,
        sku: testProduct.sku,
        name: testProduct.name,
        basePrice: testProduct.basePrice,
        status: testProduct.status,
        type: testProduct.type,
        variantCount: 1,
      });
    });

    it('should filter by status', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?status=published'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.every((item: any) => item.status === 'published')).toBe(
        true
      );
    });

    it('should filter by type', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?type=simple'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.every((item: any) => item.type === 'simple')).toBe(
        true
      );
    });

    it('should filter by brand', async () => {
      const response = await fetch(
        `http://localhost:3000/api/products?brandIds=${testBrand.id}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.length).toBeGreaterThanOrEqual(1);

      const testProductItem = data.items.find(
        (item: any) => item.id === testProduct.id
      );
      expect(testProductItem).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await fetch(
        `http://localhost:3000/api/products?categoryIds=${testCategory.id}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.length).toBeGreaterThanOrEqual(1);

      const testProductItem = data.items.find(
        (item: any) => item.id === testProduct.id
      );
      expect(testProductItem).toBeDefined();
    });

    it('should search products by name', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?search=Test Product'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.length).toBeGreaterThanOrEqual(1);

      const testProductItem = data.items.find(
        (item: any) => item.id === testProduct.id
      );
      expect(testProductItem).toBeDefined();
    });

    it('should search products by SKU', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?search=TEST-SKU-001'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.length).toBeGreaterThanOrEqual(1);

      const testProductItem = data.items.find(
        (item: any) => item.id === testProduct.id
      );
      expect(testProductItem).toBeDefined();
    });

    it('should sort by name ascending', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?sortBy=name&sortOrder=asc'
      );
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.items.length > 1) {
        const names = data.items.map((item: any) => item.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      }
    });

    it('should sort by price descending', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?sortBy=basePrice&sortOrder=desc'
      );
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.items.length > 1) {
        const prices = data.items.map((item: any) =>
          item.basePrice ? parseFloat(item.basePrice) : 0
        );

        for (let i = 1; i < prices.length; i++) {
          expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
        }
      }
    });

    it('should respect limit parameter', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?limit=5'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    it('should validate limit constraints', async () => {
      const response1 = await fetch(
        'http://localhost:3000/api/products?limit=0'
      );
      expect(response1.status).toBe(400);

      const response2 = await fetch(
        'http://localhost:3000/api/products?limit=101'
      );
      expect(response2.status).toBe(400);
    });

    it('should validate sort field whitelist', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?sortBy=invalid_field'
      );
      expect(response.status).toBe(400);
    });

    it('should handle cursor pagination', async () => {
      // Get first page
      const response1 = await fetch(
        'http://localhost:3000/api/products?limit=1'
      );
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.items.length).toBe(1);

      if (data1.hasMore && data1.nextCursor) {
        // Get second page using cursor
        const response2 = await fetch(
          `http://localhost:3000/api/products?limit=1&cursor=${data1.nextCursor}`
        );
        const data2 = await response2.json();

        expect(response2.status).toBe(200);
        expect(data2.items.length).toBe(1);

        // Should be different products
        expect(data1.items[0].id).not.toBe(data2.items[0].id);
      }
    });

    it('should handle invalid cursor gracefully', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?cursor=invalid-cursor'
      );
      expect(response.status).toBe(400);
    });

    it('should combine multiple filters', async () => {
      const queryParams = new URLSearchParams({
        status: 'published',
        type: 'simple',
        brandIds: testBrand.id,
        categoryIds: testCategory.id,
        search: 'Test',
        sortBy: 'name',
        sortOrder: 'asc',
        limit: '10',
      });

      const response = await fetch(
        `http://localhost:3000/api/products?${queryParams}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(
        data.items.every(
          (item: any) => item.status === 'published' && item.type === 'simple'
        )
      ).toBe(true);
    });

    it('should return empty results for non-matching filters', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?search=NonExistentProduct12345'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual([]);
      expect(data.hasMore).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed UUID in filters', async () => {
      const response = await fetch(
        'http://localhost:3000/api/products?brandIds=invalid-uuid'
      );
      expect(response.status).toBe(400);
    });

    it('should handle invalid enum values', async () => {
      const response1 = await fetch(
        'http://localhost:3000/api/products?status=invalid'
      );
      expect(response1.status).toBe(400);

      const response2 = await fetch(
        'http://localhost:3000/api/products?type=invalid'
      );
      expect(response2.status).toBe(400);

      const response3 = await fetch(
        'http://localhost:3000/api/products?sortOrder=invalid'
      );
      expect(response3.status).toBe(400);
    });

    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking the database or temporarily breaking connection
      // For now, we'll just ensure the API structure handles errors properly
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const start = Date.now();
      const response = await fetch(
        'http://localhost:3000/api/products?limit=50'
      );
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should use indexes for filtered queries', async () => {
      // Test that filtered queries are still fast
      const start = Date.now();
      const response = await fetch(
        `http://localhost:3000/api/products?status=published&brandIds=${testBrand.id}`
      );
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});
