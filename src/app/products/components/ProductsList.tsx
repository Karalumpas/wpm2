'use client';

import { Product, ProductListItem, PaginationInfo } from '@/types/product';
import { EnhancedProductCard } from './EnhancedProductCard';
import { ProductRow } from './ProductRow';
import { Pagination } from './Pagination';

interface ProductsListProps {
  products: ProductListItem[];
  pagination?: PaginationInfo;
  viewMode: 'grid' | 'list';
  paginationMode: 'pages' | 'loadMore';
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
}

export function ProductsList({
  products,
  pagination,
  viewMode,
  paginationMode,
  isLoading,
  isLoadingMore,
  hasMore,
  onPageChange,
  onLoadMore,
}: ProductsListProps) {
  if (isLoading && !products.length) {
    return <ProductsListSkeleton viewMode={viewMode} />;
  }

  if (!products.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No products found</div>
        <div className="text-sm text-gray-400 mt-2">
          Try adjusting your search or filters
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <EnhancedProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* List header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-700">
            <div className="col-span-1">Image</div>
            <div className="col-span-4">Product</div>
            <div className="col-span-1">SKU</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* List items */}
          <div className="divide-y">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Load More or Pagination */}
      {paginationMode === 'loadMore' ? (
        <div className="flex justify-center">
          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      ) : (
        pagination && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )
      )}
    </div>
  );
}

/**
 * Skeleton for products list
 */
function ProductsListSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-700">
        <div className="col-span-1">Image</div>
        <div className="col-span-4">Product</div>
        <div className="col-span-1">SKU</div>
        <div className="col-span-1">Price</div>
        <div className="col-span-1">Stock</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Actions</div>
      </div>

      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="aspect-square bg-gray-200 rounded-md animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3">
      <div className="col-span-1">
        <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="col-span-4 space-y-1">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="col-span-1">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="col-span-1">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="col-span-1">
        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="col-span-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="col-span-2">
        <div className="flex gap-2">
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
