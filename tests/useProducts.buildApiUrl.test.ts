import { describe, it, expect } from 'vitest';
import { buildApiUrl } from '@/app/products/hooks/useProducts';
import type { ProcessedSearchParams } from '@/app/products/params';

describe('buildApiUrl', () => {
  it('appends multiple values for array parameters', () => {
    const params: ProcessedSearchParams = {
      search: undefined,
      status: undefined,
      type: undefined,
      brandIds: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
      categoryIds: ['33333333-3333-3333-3333-333333333333'],
      shopIds: [
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
      ],
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 10,
      page: 1,
      cursor: undefined,
      viewMode: 'grid',
      paginationMode: 'pages',
    };

    const url = buildApiUrl(params);
    const searchParams = new URL(url, 'http://localhost').searchParams;

    expect(searchParams.getAll('brandIds')).toEqual(params.brandIds);
    expect(searchParams.getAll('categoryIds')).toEqual(params.categoryIds);
    expect(searchParams.getAll('shopIds')).toEqual(params.shopIds);
  });
});
