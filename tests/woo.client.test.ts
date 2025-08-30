import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WooCommerceClient,
  NetworkError,
  AuthError,
  NotFoundError,
  RateLimitedError,
  ApiError,
} from '@/lib/woo/client';

// Mock fetch globally
global.fetch = vi.fn();

describe('WooCommerceClient', () => {
  let client: WooCommerceClient;
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new WooCommerceClient({
      baseUrl: 'https://test-shop.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test456',
      timeoutMs: 5000,
      retries: 2,
    });
  });

  describe('Error handling', () => {
    it('should throw NetworkError on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(client.testConnection()).resolves.toMatchObject({
        reachable: false,
        auth: false,
        details: expect.objectContaining({
          error: expect.stringContaining('Network'),
        }),
      });
    });

    it('should throw AuthError on 401/403', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
        });

      const result = await client.testConnection();
      expect(result.reachable).toBe(true);
      expect(result.auth).toBe(false);
    });

    it('should handle rate limiting with retries', async () => {
      // Mock sleep to avoid waiting in tests
      const sleepSpy = vi
        .spyOn(client as any, 'sleep')
        .mockResolvedValue(undefined);

      // Mock two 429 responses followed by success for all endpoints
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['retry-after', '1']]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });

      // This should retry and eventually succeed
      const result = await client.testConnection();
      expect(result.reachable).toBe(true);
      expect(sleepSpy).toHaveBeenCalled();

      sleepSpy.mockRestore();
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection when all endpoints work', async () => {
      // Mock WordPress API response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        // Mock WooCommerce API response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        // Mock products API response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 1 }]),
        });

      const result = await client.testConnection();

      expect(result).toEqual({
        reachable: true,
        auth: true,
        details: {
          wpOk: true,
          wcOk: true,
          productsOk: true,
          httpStatus: 200,
          elapsedMs: expect.any(Number),
          error: null,
        },
      });
    });

    it('should handle WordPress unreachable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await client.testConnection();

      expect(result.reachable).toBe(false);
      expect(result.auth).toBe(false);
      expect(result.details.wpOk).toBe(false);
    });

    it('should handle WooCommerce auth failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const result = await client.testConnection();

      expect(result.reachable).toBe(true);
      expect(result.auth).toBe(false);
      expect(result.details.wpOk).toBe(true);
      expect(result.details.wcOk).toBe(false);
    });

    it('should handle products endpoint failure gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await client.testConnection();

      expect(result.reachable).toBe(true);
      expect(result.auth).toBe(true);
      expect(result.details.productsOk).toBe(false);
    });

    it('should measure elapsed time', async () => {
      // Add some delay to mock fetch to make test more realistic
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: () => Promise.resolve({}),
                }),
              1
            )
          )
      );

      const result = await client.testConnection();

      // Should have some meaningful elapsed time
      expect(result.details.elapsedMs).toBeGreaterThan(0);
      expect(result.details.elapsedMs).toBeLessThan(10000);
    });
  });

  describe('API methods', () => {
    it('should make GET requests with proper auth', async () => {
      const mockResponse = { products: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.get('/products');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-shop.com/wp-json/wc/v3/products',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );
    });

    it('should make POST requests with data', async () => {
      const mockProduct = { name: 'Test Product' };
      const mockResponse = { id: 1, ...mockProduct };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.post('/products', mockProduct);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-shop.com/wp-json/wc/v3/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockProduct),
        })
      );
    });

    it('should handle API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(client.get('/products')).rejects.toThrow(ApiError);
    });
  });

  describe('Retry logic', () => {
    it('should retry on 5xx errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        });

      await client.get('/products');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(client.get('/products')).rejects.toThrow(NotFoundError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry count', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(client.get('/products')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 initial + 1 retry (retries=2-1)
    });
  });
});
