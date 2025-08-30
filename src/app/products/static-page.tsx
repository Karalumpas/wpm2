'use client';

import { useState, useEffect } from 'react';
import { ProductListItem } from '@/types/product';

export default function StaticProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchProducts = async () => {
      try {
        console.log('🚀 Fetching products...');

        const response = await fetch(
          '/api/products?sortBy=updatedAt&sortOrder=desc&limit=25'
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!isCancelled) {
          setProducts(data.items || []);
          setIsLoading(false);
          console.log('✅ Products loaded:', data.items?.length || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('❌ Error fetching products:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, []); // Empty dependency array - only run once

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Products ({products.length})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
              {product.featuredImage ? (
                <img
                  src={product.featuredImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-16 h-16"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">
                  {product.basePrice} DKK
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    product.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
