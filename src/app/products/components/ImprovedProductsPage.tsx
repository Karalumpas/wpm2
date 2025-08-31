'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProcessedSearchParams } from '../params';
import { ImprovedProductsToolbar } from './ImprovedProductsToolbar';
import { ImprovedProductsList } from './ImprovedProductsList';
import { ImprovedPagination } from './ImprovedPagination';
import { useProducts } from '../hooks/useProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Package, 
  TrendingUp, 
  Eye, 
  DollarSign,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface ProductsPageProps {
  initialParams: ProcessedSearchParams;
}

export function ImprovedProductsPage({ initialParams }: ProductsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [params, setParams] = useState<ProcessedSearchParams>(initialParams);

  useEffect(() => {
    const currentPage = searchParams.get('page');
    const pageNum = currentPage ? parseInt(currentPage) : 1;

    if (pageNum !== params.page) {
      const timeoutId = setTimeout(() => {
        setParams((prev) => ({ ...prev, page: pageNum }));
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [searchParams]);

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

  const handleParamsUpdate = useCallback(
    (updates: Partial<ProcessedSearchParams>) => {
      setParams((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setParams(initialParams);
  }, [initialParams]);

  const handlePageChange = useCallback(
    (page: number) => {
      setParams((prev) => ({ ...prev, page, cursor: undefined }));
      
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

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Calculate stats from products data
  const stats = useMemo(() => {
    const products = data?.products || [];
    const total = data?.pagination?.total || 0;
    
    const published = products.filter(p => p.status === 'published').length;
    const draft = products.filter(p => p.status === 'draft').length;
    const totalValue = products.reduce((acc, p) => {
      const price = parseFloat(p.basePrice || '0');
      return acc + (isNaN(price) ? 0 : price);
    }, 0);

    return {
      total,
      published,
      draft,
      totalValue: totalValue.toFixed(2),
      showing: products.length
    };
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <ImprovedProductsToolbar
              params={params}
              onParamsUpdate={handleParamsUpdate}
              onReset={handleReset}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              totalCount={0}
              stats={stats}
              onPageChange={handlePageChange}
            />
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
              <Alert variant="destructive" className="border-0 bg-transparent">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">
                  Failed to load products. Please refresh the page or check your connection.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header with Stats */}
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Product Catalog
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your WooCommerce products from a centralized dashboard
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading || isValidating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading || isValidating ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium">
                  <Package className="h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Products</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                    <p className="text-sm text-gray-600">Published</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Eye className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                    <p className="text-sm text-gray-600">Drafts</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">DKK {stats.totalValue}</p>
                    <p className="text-sm text-gray-600">Catalog Value</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <ImprovedProductsToolbar
              params={params}
              onParamsUpdate={handleParamsUpdate}
              onReset={handleReset}
              onRefresh={handleRefresh}
              isLoading={isLoading || isValidating}
              totalCount={data?.pagination?.total || 0}
              stats={stats}
              pagination={data?.pagination ? {
                page: data.pagination.page,
                limit: data.pagination.limit,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
                hasNextPage: !!data.pagination.nextCursor,
                hasPreviousPage: !!data.pagination.cursor,
              } : undefined}
              onPageChange={handlePageChange}
            />
          </div>

          {/* Products Grid/List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <ImprovedProductsList
              products={data?.products || []}
              pagination={data?.pagination ? {
                page: data.pagination.page,
                limit: data.pagination.limit,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
                hasNextPage: !!data.pagination.nextCursor,
                hasPreviousPage: !!data.pagination.cursor,
              } : undefined}
              viewMode={params.viewMode}
              paginationMode={params.paginationMode as 'pages' | 'infinite'}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onPageChange={handlePageChange}
              onLoadMore={handleLoadMore}
            />
          </div>

          {/* Pagination */}
          {params.paginationMode === 'pages' && data?.pagination && (
            <div className="flex justify-center">
              <ImprovedPagination
                pagination={{
                  page: data.pagination.page,
                  limit: data.pagination.limit,
                  total: data.pagination.total,
                  totalPages: data.pagination.totalPages,
                  hasNextPage: !!data.pagination.nextCursor,
                  hasPreviousPage: !!data.pagination.cursor,
                }}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}