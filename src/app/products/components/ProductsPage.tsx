'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProcessedSearchParams } from '../params';
import { ProductsToolbar } from './ProductsToolbar';
import { ProductsList } from './ProductsList';
import { useProducts } from '../hooks/useProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProductsPageProps {
  initialParams: ProcessedSearchParams;
}

export function ProductsPage({ initialParams }: ProductsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use local state instead of URL state to prevent infinite loops
  const [params, setParams] = useState<ProcessedSearchParams>(initialParams);

  // Update local state when URL parameters change (for direct navigation)
  useEffect(() => {
    const currentPage = searchParams.get('page');
    const pageNum = currentPage ? parseInt(currentPage) : 1;

    if (pageNum !== params.page) {
      // Use a timeout to debounce URL changes and prevent loops
      const timeoutId = setTimeout(() => {
        setParams((prev) => ({ ...prev, page: pageNum }));
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [searchParams]);

  // Stabilize params to prevent unnecessary re-renders
  const stableParams = useMemo(
    () => params,
    [
      params.search,
      params.sortBy,
      params.sortOrder,
      params.limit,
      params.page,
      params.cursor,
      params.status,
      params.type,
      params.brandIds.join(','),
      params.categoryIds.join(','),
      params.shopIds.join(','),
      params.viewMode,
      params.paginationMode,
    ]
  );

  // Fetch products with SWR
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useProducts(stableParams);

  // Handle parameter updates
  const handleParamsUpdate = useCallback(
    (updates: Partial<ProcessedSearchParams>) => {
      setParams((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Handle reset
  const handleReset = useCallback(() => {
    setParams(initialParams);
  }, [initialParams]);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setParams((prev) => ({ ...prev, page, cursor: undefined }));

      // Update URL to reflect current page
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('page', page.toString());
      router.push(`/products?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <ProductsToolbar
          params={params}
          onParamsUpdate={handleParamsUpdate}
          onReset={handleReset}
          isLoading={isLoading}
          totalCount={0}
          onPageChange={handlePageChange}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load products. Please try again or check your connection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <ProductsToolbar
        params={params}
        onParamsUpdate={handleParamsUpdate}
        onReset={handleReset}
        isLoading={isLoading || isValidating}
        totalCount={data?.pagination?.total || 0}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
      />

      {/* Products List */}
      <ProductsList
        products={data?.products || []}
        pagination={data?.pagination}
        viewMode={params.viewMode}
        paginationMode={params.paginationMode}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onPageChange={handlePageChange}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
