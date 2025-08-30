import { describe, it, expect } from 'vitest';
import {
  getProductsQuerySchema,
  cursorSchema,
  productListItemSchema,
  productsListResponseSchema,
  getFiltersResponseSchema,
  createProductSchema,
  updateProductSchema,
} from '@/lib/validation/products';

describe('Products validation schemas', () => {
  describe('getProductsQuerySchema', () => {
    it('should accept valid query with defaults', () => {
      const result = getProductsQuerySchema.parse({});
      
      expect(result.limit).toBe(25);
      expect(result.sortBy).toBe('updatedAt');
      expect(result.sortOrder).toBe('desc');
      expect(result.cursor).toBeUndefined();
      expect(result.search).toBeUndefined();
    });

    it('should validate and coerce limit', () => {
      const result = getProductsQuerySchema.parse({ limit: '50' });
      expect(result.limit).toBe(50);
    });

    it('should enforce limit constraints', () => {
      expect(() => getProductsQuerySchema.parse({ limit: '0' }))
        .toThrow();
      
      expect(() => getProductsQuerySchema.parse({ limit: '101' }))
        .toThrow();
    });

    it('should validate sortBy whitelist', () => {
      const validSorts = ['name', 'basePrice', 'sku', 'createdAt', 'updatedAt'];
      
      validSorts.forEach(sortBy => {
        const result = getProductsQuerySchema.parse({ sortBy });
        expect(result.sortBy).toBe(sortBy);
      });

      expect(() => getProductsQuerySchema.parse({ sortBy: 'invalid_field' }))
        .toThrow();
    });

    it('should validate sortOrder enum', () => {
      const result1 = getProductsQuerySchema.parse({ sortOrder: 'asc' });
      expect(result1.sortOrder).toBe('asc');

      const result2 = getProductsQuerySchema.parse({ sortOrder: 'desc' });
      expect(result2.sortOrder).toBe('desc');

      expect(() => getProductsQuerySchema.parse({ sortOrder: 'invalid' }))
        .toThrow();
    });

    it('should validate status filter', () => {
      const validStatuses = ['published', 'draft', 'private'];
      
      validStatuses.forEach(status => {
        const result = getProductsQuerySchema.parse({ status });
        expect(result.status).toBe(status);
      });

      expect(() => getProductsQuerySchema.parse({ status: 'invalid' }))
        .toThrow();
    });

    it('should validate type filter', () => {
      const validTypes = ['simple', 'variable', 'grouped'];
      
      validTypes.forEach(type => {
        const result = getProductsQuerySchema.parse({ type });
        expect(result.type).toBe(type);
      });

      expect(() => getProductsQuerySchema.parse({ type: 'invalid' }))
        .toThrow();
    });

    it('should validate UUID arrays for brand and category filters', () => {
      const validUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const result = getProductsQuerySchema.parse({
        brandIds: [validUuid],
        categoryIds: [validUuid],
      });
      
      expect(result.brandIds).toEqual([validUuid]);
      expect(result.categoryIds).toEqual([validUuid]);

      expect(() => getProductsQuerySchema.parse({ brandIds: ['invalid-uuid'] }))
        .toThrow();
    });

    it('should handle legacy page parameter', () => {
      const result = getProductsQuerySchema.parse({ page: '2' });
      expect(result.page).toBe(2);

      expect(() => getProductsQuerySchema.parse({ page: '0' }))
        .toThrow();
    });

    it('should validate cursor string', () => {
      const result = getProductsQuerySchema.parse({ cursor: 'base64-encoded-cursor' });
      expect(result.cursor).toBe('base64-encoded-cursor');
    });

    it('should handle search parameter', () => {
      const result = getProductsQuerySchema.parse({ search: 'iPhone' });
      expect(result.search).toBe('iPhone');
    });
  });

  describe('cursorSchema', () => {
    it('should validate cursor data structure', () => {
      const validCursor = {
        updatedAt: '2025-08-28T10:15:00.000Z',
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const result = cursorSchema.parse(validCursor);
      expect(result).toEqual(validCursor);
    });

    it('should reject invalid datetime', () => {
      expect(() => cursorSchema.parse({
        updatedAt: 'invalid-date',
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      })).toThrow();
    });

    it('should reject invalid UUID', () => {
      expect(() => cursorSchema.parse({
        updatedAt: '2025-08-28T10:15:00.000Z',
        id: 'invalid-uuid',
      })).toThrow();
    });
  });

  describe('productListItemSchema', () => {
    it('should validate complete product item', () => {
      const validItem = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sku: 'IPHONE-15-PRO',
        name: 'iPhone 15 Pro',
        basePrice: '999.99',
        status: 'published' as const,
        type: 'variable' as const,
        updatedAt: '2025-08-28T10:15:00.000Z',
        variantCount: 12,
      };

      const result = productListItemSchema.parse(validItem);
      expect(result).toEqual(validItem);
    });

    it('should allow null basePrice', () => {
      const validItem = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sku: 'FREE-SAMPLE',
        name: 'Free Sample',
        basePrice: null,
        status: 'published' as const,
        type: 'simple' as const,
        updatedAt: '2025-08-28T10:15:00.000Z',
        variantCount: 0,
      };

      const result = productListItemSchema.parse(validItem);
      expect(result.basePrice).toBeNull();
    });

    it('should validate optional variantPreview', () => {
      const validItem = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        sku: 'VARIABLE-PRODUCT',
        name: 'Variable Product',
        basePrice: '99.99',
        status: 'published' as const,
        type: 'variable' as const,
        updatedAt: '2025-08-28T10:15:00.000Z',
        variantCount: 3,
        variantPreview: [
          { color: 'Black', size: 'L' },
          { color: 'White', size: 'M' },
        ],
      };

      const result = productListItemSchema.parse(validItem);
      expect(result.variantPreview).toEqual(validItem.variantPreview);
    });
  });

  describe('productsListResponseSchema', () => {
    it('should validate complete response', () => {
      const validResponse = {
        items: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            sku: 'TEST-SKU',
            name: 'Test Product',
            basePrice: '99.99',
            status: 'published' as const,
            type: 'simple' as const,
            updatedAt: '2025-08-28T10:15:00.000Z',
            variantCount: 1,
          },
        ],
        hasMore: true,
        nextCursor: 'base64-cursor',
        total: 100,
      };

      const result = productsListResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should allow optional fields', () => {
      const minimalResponse = {
        items: [],
        hasMore: false,
      };

      const result = productsListResponseSchema.parse(minimalResponse);
      expect(result.nextCursor).toBeUndefined();
      expect(result.total).toBeUndefined();
    });
  });

  describe('getFiltersResponseSchema', () => {
    it('should validate filters response', () => {
      const validResponse = {
        categories: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Electronics',
            parentId: null,
          },
        ],
        brands: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Apple',
          },
        ],
        statuses: ['published', 'draft', 'private'] as const,
        types: ['simple', 'variable', 'grouped'] as const,
      };

      const result = getFiltersResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should allow empty arrays', () => {
      const emptyResponse = {
        categories: [],
        brands: [],
        statuses: [],
        types: [],
      };

      const result = getFiltersResponseSchema.parse(emptyResponse);
      expect(result).toEqual(emptyResponse);
    });
  });

  describe('createProductSchema', () => {
    it('should validate complete product creation', () => {
      const validProduct = {
        sku: 'NEW-PRODUCT-SKU',
        name: 'New Product',
        description: 'A great new product',
        basePrice: 99.99,
        status: 'draft' as const,
        type: 'simple' as const,
        brandIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        categoryIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
      };

      const result = createProductSchema.parse(validProduct);
      expect(result).toEqual(validProduct);
    });

    it('should use defaults for optional fields', () => {
      const minimalProduct = {
        sku: 'MIN-SKU',
        name: 'Minimal Product',
      };

      const result = createProductSchema.parse(minimalProduct);
      expect(result.status).toBe('draft');
      expect(result.type).toBe('simple');
    });

    it('should validate constraints', () => {
      expect(() => createProductSchema.parse({ sku: '', name: 'Test' }))
        .toThrow(); // empty sku

      expect(() => createProductSchema.parse({ sku: 'TEST', name: '' }))
        .toThrow(); // empty name

      expect(() => createProductSchema.parse({ 
        sku: 'TEST', 
        name: 'Test', 
        basePrice: -1 
      })).toThrow(); // negative price
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial update with ID', () => {
      const update = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Updated Name',
        basePrice: 199.99,
      };

      const result = updateProductSchema.parse(update);
      expect(result.id).toBe(update.id);
      expect(result.name).toBe(update.name);
      expect(result.basePrice).toBe(update.basePrice);
    });

    it('should require ID field', () => {
      expect(() => updateProductSchema.parse({ name: 'Updated Name' }))
        .toThrow();
    });

    it('should allow empty updates (only ID)', () => {
      const update = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const result = updateProductSchema.parse(update);
      expect(result.id).toBe(update.id);
    });
  });
});
