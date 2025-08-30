'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProcessedSearchParams, serializeSearchParams } from '../params';
import { ProductsToolbar } from './ProductsToolbar';
import { ProductsList } from './ProductsList';
import { useProducts } from '../hooks/useProducts';
import { useUrlState } from '../hooks/useUrlState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProductsPageProps {
  initialParams: ProcessedSearchParams;
}

export function ProductsPage({ initialParams }: ProductsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL state management
  const { params, updateParams, resetParams } = useUrlState(initialParams);
  
  // Fetch products with SWR
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    loadMore,
    hasMore,
    isLoadingMore
  } = useProducts(params);

  // Debug logging
  console.log('🖥️ ProductsPage state:', {
    data,
    error,
    isLoading,
    params,
    productsCount: data?.products?.length,
    paginationTotal: data?.pagination?.total
  });

  // Handle parameter updates
  const handleParamsUpdate = (updates: Partial<ProcessedSearchParams>) => {
    updateParams(updates);
  };

  // Handle reset
  const handleReset = () => {
    resetParams();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateParams({ page, cursor: undefined });
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <ProductsToolbar
          params={params}
          onParamsUpdate={handleParamsUpdate}
          onReset={handleReset}
          isLoading={isLoading}
          totalCount={0}
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
    <div className="space-y-6">
      {/* Toolbar */}
      <ProductsToolbar
        params={params}
        onParamsUpdate={handleParamsUpdate}
        onReset={handleReset}
        isLoading={isLoading || isValidating}
        totalCount={data?.pagination?.total || 0}
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
