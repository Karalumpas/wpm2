import { describe, it, expect } from 'vitest';
import { getProductsQuerySchema } from '@/lib/validation/products';

describe('Products API query parsing', () => {
  const id1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const id2 = '9c5d1d62-1f0e-4e6d-8a6b-6d2f5a6a4b2d';

  it('parses repeated query params into arrays', () => {
    const params = new URLSearchParams();
    params.append('brandIds', id1);
    params.append('brandIds', id2);
    params.append('categoryIds', id1);

    const requestParams = {
      cursor: params.get('cursor') || undefined,
      limit: params.get('limit') || undefined,
      page: params.get('page') || undefined,
      search: params.get('search') || undefined,
      sortBy: params.get('sortBy') || undefined,
      sortOrder: params.get('sortOrder') || undefined,
      status: params.get('status') || undefined,
      type: params.get('type') || undefined,
      brandIds: params.getAll('brandIds').filter(Boolean),
      categoryIds: params.getAll('categoryIds').filter(Boolean),
      shopIds: params.getAll('shopIds').filter(Boolean),
    };

    const validated = getProductsQuerySchema.parse(requestParams);
    expect(validated.brandIds).toEqual([id1, id2]);
    expect(validated.categoryIds).toEqual([id1]);
  });

  it('rejects comma separated values in single param', () => {
    const params = new URLSearchParams();
    params.set('brandIds', `${id1},${id2}`);

    const requestParams = {
      cursor: params.get('cursor') || undefined,
      limit: params.get('limit') || undefined,
      page: params.get('page') || undefined,
      search: params.get('search') || undefined,
      sortBy: params.get('sortBy') || undefined,
      sortOrder: params.get('sortOrder') || undefined,
      status: params.get('status') || undefined,
      type: params.get('type') || undefined,
      brandIds: params.getAll('brandIds').filter(Boolean),
      categoryIds: params.getAll('categoryIds').filter(Boolean),
      shopIds: params.getAll('shopIds').filter(Boolean),
    };

    expect(() => getProductsQuerySchema.parse(requestParams)).toThrow();
  });
});
