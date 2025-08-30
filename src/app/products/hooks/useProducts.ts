'use client';

import useSWR from 'swr';
import { useMemo, useCallback, useState } from 'react';
import { ProcessedSearchParams } from '../params';
import { ProductListItem } from '@/types/product';

interface ProductsResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursor?: string;
    nextCursor?: string;
  };
}

interface UseProductsResult {
  data: ProductsResponse | undefined;
  error: unknown;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

/**
 * Fetcher function for SWR that transforms API response
 */
async function fetcher(url: string): Promise<ProductsResponse> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const apiData = await response.json();

    // Transform API response to expected format
    // API returns: { items, hasMore, nextCursor, total?, pagination? }
    // Component expects: { products, pagination }

    const transformedData = {
      products: apiData.items || [],
      pagination: apiData.pagination || {
        page: 1,
        limit: apiData.items?.length || 0,
        total: apiData.total || apiData.items?.length || 0,
        totalPages: apiData.total
          ? Math.ceil(apiData.total / (apiData.items?.length || 1))
          : 1,
        hasNext: apiData.hasMore || false,
        hasPrev: false,
        cursor: undefined,
        nextCursor: apiData.nextCursor,
      },
    };

    return transformedData;
  } catch (error) {
    throw error;
  }
}

/**
 * Build API URL from parameters
 */
export function buildApiUrl(params: ProcessedSearchParams): string {
  const searchParams = new URLSearchParams();

  // Add non-empty parameters
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.brandIds.length > 0)
    params.brandIds.forEach((id) => searchParams.append('brandIds', id));
  if (params.categoryIds.length > 0)
    params.categoryIds.forEach((id) => searchParams.append('categoryIds', id));
  if (params.shopIds.length > 0)
    params.shopIds.forEach((id) => searchParams.append('shopIds', id));

  searchParams.set('sortBy', params.sortBy);
  searchParams.set('sortOrder', params.sortOrder);
  searchParams.set('limit', params.limit.toString());

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.cursor) searchParams.set('cursor', params.cursor);

  return `/api/products?${searchParams.toString()}`;
}

/**
 * Hook for fetching products with SWR
 */
export function useProducts(params: ProcessedSearchParams): UseProductsResult {
  // Create stable cache key to prevent unnecessary re-fetches
  const cacheKey = useMemo(() => {
    const sortedParams: ProcessedSearchParams = {
      ...params,
      brandIds: [...params.brandIds].sort(),
      categoryIds: [...params.categoryIds].sort(),
      shopIds: [...params.shopIds].sort(),
    };

    return buildApiUrl(sortedParams);
  }, [
    params.search,
    params.status,
    params.type,
    params.brandIds.join(','),
    params.categoryIds.join(','),
    params.shopIds.join(','),
    params.sortBy,
    params.sortOrder,
    params.limit,
    params.page,
    params.cursor,
  ]);

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ProductsResponse>(cacheKey, fetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 30000, // Increased from 10s to 30s
      errorRetryCount: 1, // Reduced from 2 to 1
      errorRetryInterval: 5000, // Increased from 2s to 5s
    });

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load more for infinite scroll
  const loadMore = useCallback(async () => {
    if (!data?.pagination.nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    const nextUrl = buildApiUrl({
      ...params,
      cursor: data.pagination.nextCursor,
      page: undefined, // Remove page when using cursor
    });

    try {
      const nextData = await fetcher(nextUrl);

      // Merge with existing data
      mutate(
        {
          ...nextData,
          products: [...data.products, ...nextData.products],
          pagination: {
            ...nextData.pagination,
            total: data.pagination.total, // Keep original total
          },
        },
        false
      );
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [data, params, mutate, isLoadingMore]);

  const hasMore = useMemo(() => {
    if (!data?.pagination) return false;

    if (params.paginationMode === 'loadMore') {
      return !!data.pagination.nextCursor;
    } else {
      return data.pagination.hasNext;
    }
  }, [data?.pagination, params.paginationMode]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}
