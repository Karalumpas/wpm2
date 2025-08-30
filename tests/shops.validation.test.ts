import { describe, it, expect } from 'vitest';
import {
  createShopSchema,
  updateShopSchema,
  shopResponseSchema,
  connectionTestResponseSchema,
} from '@/lib/validation/shops';

describe('Shops validation schemas', () => {
  describe('createShopSchema', () => {
    it('should validate valid shop data', () => {
      const validData = {
        name: 'Test Shop',
        url: 'https://example.com',
        consumerKey: 'ck_test123456789',
        consumerSecret: 'cs_test123456789',
      };

      const result = createShopSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should normalize URLs correctly', () => {
      const testCases = [
        {
          input: 'http://example.com',
          expected: 'https://example.com',
        },
        {
          input: 'https://example.com/',
          expected: 'https://example.com',
        },
        {
          input: 'example.com',
          expected: 'https://example.com',
        },
        {
          input: 'example.com/path/',
          expected: 'https://example.com/path',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = createShopSchema.parse({
          name: 'Test Shop',
          url: input,
          consumerKey: 'ck_test123456789',
          consumerSecret: 'cs_test123456789',
        });

        expect(result.url).toBe(expected);
      });
    });

    it('should reject invalid data', () => {
      const invalidCases = [
        {
          data: {
            name: '',
            url: 'https://example.com',
            consumerKey: 'ck_test123456789',
            consumerSecret: 'cs_test123456789',
          },
          error: 'name',
        },
        {
          data: {
            name: 'Test Shop',
            url: '',
            consumerKey: 'ck_test123456789',
            consumerSecret: 'cs_test123456789',
          },
          error: 'url',
        },
        {
          data: {
            name: 'Test Shop',
            url: 'https://example.com',
            consumerKey: 'short',
            consumerSecret: 'cs_test123456789',
          },
          error: 'consumerKey',
        },
        {
          data: {
            name: 'Test Shop',
            url: 'https://example.com',
            consumerKey: 'ck_test123456789',
            consumerSecret: 'short',
          },
          error: 'consumerSecret',
        },
      ];

      invalidCases.forEach(({ data, error }) => {
        expect(() => createShopSchema.parse(data)).toThrow();
      });
    });

    it('should handle long shop names', () => {
      const longName = 'a'.repeat(256);

      expect(() =>
        createShopSchema.parse({
          name: longName,
          url: 'https://example.com',
          consumerKey: 'ck_test123456789',
          consumerSecret: 'cs_test123456789',
        })
      ).toThrow();
    });
  });

  describe('updateShopSchema', () => {
    it('should validate partial updates', () => {
      const validUpdates = [
        { name: 'Updated Shop Name' },
        { url: 'https://newdomain.com' },
        { status: 'inactive' as const },
        { consumerKey: 'ck_newkey123456789' },
        { consumerSecret: 'cs_newsecret123456789' },
        { name: 'New Name', status: 'active' as const },
      ];

      validUpdates.forEach((update) => {
        const result = updateShopSchema.parse(update);
        expect(result).toEqual(update);
      });
    });

    it('should normalize URLs in updates', () => {
      const result = updateShopSchema.parse({
        url: 'http://example.com/',
      });

      expect(result.url).toBe('https://example.com');
    });

    it('should reject invalid status values', () => {
      expect(() =>
        updateShopSchema.parse({
          status: 'invalid-status',
        })
      ).toThrow();
    });

    it('should allow empty object', () => {
      const result = updateShopSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('shopResponseSchema', () => {
    it('should validate shop response data', () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Shop',
        url: 'https://example.com',
        status: 'active' as const,
        lastConnectionOk: true,
        lastConnectionCheckAt: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = shopResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should allow null values for optional fields', () => {
      const responseWithNulls = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Shop',
        url: 'https://example.com',
        status: 'active' as const,
        lastConnectionOk: null,
        lastConnectionCheckAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = shopResponseSchema.parse(responseWithNulls);
      expect(result).toEqual(responseWithNulls);
    });
  });

  describe('connectionTestResponseSchema', () => {
    it('should validate connection test response', () => {
      const validResponse = {
        reachable: true,
        auth: true,
        details: {
          wpOk: true,
          wcOk: true,
          productsOk: true,
          httpStatus: 200,
          elapsedMs: 1500,
          error: null,
        },
      };

      const result = connectionTestResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate failed connection test', () => {
      const failedResponse = {
        reachable: false,
        auth: false,
        details: {
          wpOk: false,
          wcOk: false,
          productsOk: null,
          httpStatus: null,
          elapsedMs: 5000,
          error: 'Network timeout',
        },
      };

      const result = connectionTestResponseSchema.parse(failedResponse);
      expect(result).toEqual(failedResponse);
    });
  });
});
