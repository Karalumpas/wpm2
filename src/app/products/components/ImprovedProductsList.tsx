'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ImprovedPagination, Pagination } from './ImprovedPagination';
import SwipeCarousel from '@/components/ui/SwipeCarousel';
import {
  Package,
  Edit,
  Eye,
  MoreHorizontal,
  Star,
  ShoppingCart,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  type: string;
  basePrice?: string;
  regularPrice?: string;
  salePrice?: string;
  stockStatus?: string;
  featuredImage?: string;
  images?: string[];
  updatedAt?: string;
  // Add other product properties as needed
}

interface ImprovedProductsListProps {
  products: Product[];
  pagination?: Pagination | undefined;
  viewMode: 'grid' | 'list';
  paginationMode: 'pages' | 'infinite' | 'loadMore';
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
}

export function ImprovedProductsList({
  products,
  pagination,
  viewMode,
  paginationMode,
  isLoading,
  isLoadingMore,
  hasMore,
  onPageChange,
  onLoadMore,
}: ImprovedProductsListProps) {
  if (isLoading && products.length === 0) {
    return <ProductsListSkeleton viewMode={viewMode} />;
  }

  if (!isLoading && products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-6">
      {viewMode === 'grid' ? (
        <ProductsGrid products={products} />
      ) : (
        <ProductsListView products={products} />
      )}

      {/* Load More or Pagination */}
      {paginationMode === 'infinite' && hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Load More Products
              </>
            )}
          </button>
        </div>
      )}

      {paginationMode === 'pages' && pagination && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <ImprovedPagination
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

function ProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductGridCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductsListView({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductListCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductGridCard({ product }: { product: Product }) {
  // Prepare images array for carousel
  const images = [];
  if (product.featuredImage) {
    images.push(product.featuredImage);
  }
  if (product.images) {
    // Add other images, but avoid duplicating the featured image
    const otherImages = product.images.filter(
      (img) => img !== product.featuredImage
    );
    images.push(...otherImages);
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300">
      {/* Image Carousel */}
      <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {images.length > 0 ? (
          <SwipeCarousel
            images={images}
            alt={product.name}
            className="h-full"
            aspect="square"
            draggable={true}
            priority={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <Link
            href={`/products/${product.id}`}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-relaxed"
          >
            {product.name}
          </Link>
          <p className="text-xs text-gray-500 font-mono mt-1">
            SKU: {product.sku}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {product.basePrice && (
              <p className="text-lg font-bold text-gray-900">
                DKK {parseFloat(product.basePrice).toFixed(2)}
              </p>
            )}
            {product.regularPrice && product.salePrice && (
              <p className="text-xs text-gray-500 line-through">
                DKK {parseFloat(product.regularPrice).toFixed(2)}
              </p>
            )}
          </div>

          <TypeBadge type={product.type} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <StockStatusBadge status={product.stockStatus} />
          {product.updatedAt && (
            <p className="text-xs text-gray-500">
              {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Link
            href={`/products/${product.id}`}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
          <Link
            href={`/products/${product.id}/edit`}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductListCard({ product }: { product: Product }) {
  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage}
              alt={product.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${product.id}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block truncate"
              >
                {product.name}
              </Link>
              <p className="text-sm text-gray-500 font-mono">
                SKU: {product.sku}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={product.status} />
              <TypeBadge type={product.type} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {product.basePrice && (
                <p className="text-lg font-bold text-gray-900">
                  DKK {parseFloat(product.basePrice).toFixed(2)}
                </p>
              )}
              <StockStatusBadge status={product.stockStatus} />
            </div>

            <div className="flex items-center gap-2">
              {product.updatedAt && (
                <p className="text-sm text-gray-500">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </p>
              )}

              <div className="flex items-center gap-1">
                <Link
                  href={`/products/${product.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/products/${product.id}/edit`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    draft: 'bg-amber-100 text-amber-700 border-amber-200',
    private: 'bg-gray-100 text-gray-700 border-gray-200',
  } as Record<string, string>;

  return (
    <span
      className={`px-2 py-1 text-xs rounded-md border font-medium ${styles[status] || styles.private}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles = {
    simple: 'bg-blue-100 text-blue-700',
    variable: 'bg-purple-100 text-purple-700',
    grouped: 'bg-orange-100 text-orange-700',
  } as Record<string, string>;

  return (
    <span
      className={`px-2 py-1 text-xs rounded-md font-medium ${styles[type] || styles.simple}`}
    >
      {type}
    </span>
  );
}

function StockStatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const styles = {
    instock: 'bg-emerald-100 text-emerald-700',
    outofstock: 'bg-red-100 text-red-700',
    onbackorder: 'bg-amber-100 text-amber-700',
  } as Record<string, string>;

  return (
    <span
      className={`px-2 py-1 text-xs rounded-md font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  );
}

function ProductsListSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  const items = Array.from({ length: viewMode === 'grid' ? 12 : 8 });

  if (viewMode === 'grid') {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded-full w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {items.map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 rounded-full w-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Package className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No products found
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        We couldn&apos;t find any products matching your search criteria. Try
        adjusting your filters or search terms.
      </p>
      <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
        <Package className="h-4 w-4" />
        Add Your First Product
      </button>
    </div>
  );
}
