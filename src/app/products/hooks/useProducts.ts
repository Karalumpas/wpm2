'use client';

import useSWR from 'swr';
import { useMemo, useCallback } from 'react';
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
  error: any;
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
    console.log('🚀 Fetcher called with URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    console.log('🔄 Fetcher received API data:', apiData);
    
    // Transform API response to expected format
    // API returns: { items, hasMore, nextCursor }
    // Component expects: { products, pagination }
    
    const transformedData = {
      products: apiData.items || [],
      pagination: {
        page: 1, // TODO: Extract from URL params if needed
        limit: apiData.items?.length || 0,
        total: apiData.items?.length || 0, // TODO: Get actual total from API
        totalPages: 1, // TODO: Calculate based on total
        hasNext: apiData.hasMore || false,
        hasPrev: false, // TODO: Calculate based on current page
        cursor: undefined, // TODO: Extract from request
        nextCursor: apiData.nextCursor,
      },
    };
    
    console.log('✨ Fetcher transformed data:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error('❌ Fetcher error:', error);
    throw error;
  }
}

/**
 * Build API URL from parameters
 */
function buildApiUrl(params: ProcessedSearchParams): string {
  const searchParams = new URLSearchParams();
  
  // Add non-empty parameters
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.brandIds.length > 0) searchParams.set('brandIds', params.brandIds.join(','));
  if (params.categoryIds.length > 0) searchParams.set('categoryIds', params.categoryIds.join(','));
  
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
  const apiUrl = useMemo(() => buildApiUrl(params), [params]);
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<ProductsResponse>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Load more for infinite scroll
  const loadMore = useCallback(async () => {
    if (!data?.pagination.nextCursor) return;
    
    const nextUrl = buildApiUrl({
      ...params,
      cursor: data.pagination.nextCursor,
      page: undefined, // Remove page when using cursor
    });
    
    try {
      const nextData = await fetcher(nextUrl);
      
      // Merge with existing data
      mutate({
        ...nextData,
        products: [...data.products, ...nextData.products],
        pagination: {
          ...nextData.pagination,
          total: data.pagination.total, // Keep original total
        },
      }, false);
    } catch (err) {
      console.error('Failed to load more products:', err);
    }
  }, [data, params, mutate]);

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
    isLoadingMore: false, // TODO: Implement proper loading state for loadMore
  };
}
