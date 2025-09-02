'use client';

import { ProductListItem } from '@/types/product';
import { ModernProductCard } from './ModernProductCard';
import { ProcessedSearchParams } from '../params';
import { Package, Loader2 } from 'lucide-react';

interface ModernProductsListProps {
  products: ProductListItem[];
  params: ProcessedSearchParams;
  isLoading: boolean;
  isValidating: boolean;
}

export function ModernProductsList({ 
  products, 
  params, 
  isLoading, 
  isValidating 
}: ModernProductsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600 text-center max-w-md">
          {params.search 
            ? `No products match your search "${params.search}". Try adjusting your filters or search terms.`
            : 'No products available. Create your first product to get started.'
          }
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Product
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isValidating && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Updating results...</span>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      {params.viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ModernProductCard 
              key={product.id} 
              product={product} 
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        /* List Layout */
        <div className="space-y-4">
          {products.map((product) => (
            <ModernProductCard 
              key={product.id} 
              product={product} 
              viewMode="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
