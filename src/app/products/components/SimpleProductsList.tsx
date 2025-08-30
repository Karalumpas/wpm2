'use client';

import { useState, useEffect } from 'react';

interface SimpleProduct {
  id: string;
  name: string;
  sku: string;
  basePrice: string;
  status: string;
  type: string;
  updatedAt: string;
}

interface ApiResponse {
  items: SimpleProduct[];
  hasMore: boolean;
  nextCursor?: string;
}

export function SimpleProductsList() {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('🚀 SimpleProductsList: Starting fetch...');
        setLoading(true);

        const response = await fetch('/api/products?limit=5');
        console.log('🌐 SimpleProductsList: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        console.log('📦 SimpleProductsList: Data received:', data);

        setProducts(data.items || []);
        setError(null);
      } catch (err) {
        console.error('❌ SimpleProductsList: Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-medium">Error loading products</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-gray-800 font-medium">No products found</h3>
        <p className="text-gray-600 text-sm">The API returned an empty list.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Products ({products.length})</h3>
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-4 border border-gray-200 rounded-lg"
          >
            <h4 className="font-medium">{product.name}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>SKU: {product.sku}</p>
              <p>Price: ${product.basePrice}</p>
              <p>Status: {product.status}</p>
              <p>Type: {product.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
