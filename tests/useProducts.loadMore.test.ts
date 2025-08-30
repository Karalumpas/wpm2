// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProducts } from '@/app/products/hooks/useProducts';
import type { ProcessedSearchParams } from '@/app/products/params';

describe('useProducts loadMore state', () => {
  const initialApi = {
    items: [{ id: '1' }],
    total: 3,
    hasMore: true,
    nextCursor: 'cursor1',
  };

  const loadMoreApi1 = {
    items: [{ id: '2' }],
    total: 3,
    hasMore: true,
    nextCursor: 'cursor2',
  };

  const loadMoreApi2 = {
    items: [{ id: '3' }],
    total: 3,
    hasMore: false,
  };

  const params: ProcessedSearchParams = {
    search: '',
    status: undefined,
    type: undefined,
    brandIds: [],
    categoryIds: [],
    shopIds: [],
    sortBy: 'name',
    sortOrder: 'asc',
    limit: 1,
    page: 1,
    cursor: undefined,
    viewMode: 'grid',
    paginationMode: 'loadMore',
  };

  function createFetchResponse(data: unknown): Partial<Response> {
    return {
      ok: true,
      json: () => Promise.resolve(data),
    } as Response;
  }

  it('toggles isLoadingMore during consecutive loadMore calls', async () => {
    const originalFetch = global.fetch;
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(initialApi))
      .mockResolvedValueOnce(createFetchResponse(loadMoreApi1))
      .mockResolvedValueOnce(createFetchResponse(loadMoreApi2));
    // @ts-expect-error mock global fetch
    global.fetch = mockFetch;

    const { result } = renderHook(() => useProducts(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    let loadPromise: Promise<unknown>;

    act(() => {
      loadPromise = result.current.loadMore();
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(true));
    await act(async () => {
      await loadPromise;
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(2);

    act(() => {
      loadPromise = result.current.loadMore();
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(true));
    await act(async () => {
      await loadPromise;
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(3);

    global.fetch = originalFetch;
  });
});
