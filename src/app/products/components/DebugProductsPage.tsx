'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProcessedSearchParams } from '../params';
import { ProductListItem } from '@/types/product';

interface DebugProductsPageProps {
  initialParams: ProcessedSearchParams;
}

// Simple debugging component to isolate the infinite loop issue
export const DebugProductsPage = memo(({ initialParams }: DebugProductsPageProps) => {
  const [renderCount, setRenderCount] = useState(0);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Stable URL string to prevent unnecessary re-renders
  const urlString = useMemo(() => searchParams.toString(), [searchParams]);
  
  // Only track URL changes, not searchParams object changes
  useEffect(() => {
    console.log('🔄 URL changed:', urlString);
    console.log('📊 Render count:', renderCount + 1);
    setRenderCount(prev => prev + 1);
  }, [urlString]);
  
  // Simple fetch without SWR
  useEffect(() => {
    let isCancelled = false;
    
    const fetchProducts = async () => {
      if (isLoading) return; // Prevent concurrent requests
      
      try {
        setIsLoading(true);
        console.log('🚀 Fetching products...');
        
        const params = new URLSearchParams();
        params.set('sortBy', 'updatedAt');
        params.set('sortOrder', 'desc');
        params.set('limit', '25');
        
        const response = await fetch(`/api/products?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!isCancelled) {
          setProducts(data.items || []);
          console.log('✅ Products loaded:', data.items?.length || 0);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ Error fetching products:', error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    // Only fetch once on mount
    if (products.length === 0) {
      fetchProducts();
    }
    
    return () => {
      isCancelled = true;
    };
  }, []); // Empty dependency array - only run once
  
  return (
    <div className="p-6">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold text-blue-800">Debug Info</h2>
        <p>Render count: {renderCount}</p>
        <p>URL: {urlString}</p>
        <p>Products loaded: {products.length}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.slice(0, 12).map((product) => (
          <div key={product.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.sku}</p>
            <p className="text-lg font-bold text-green-600">{product.basePrice} DKK</p>
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <p>Loading products...</p>
        </div>
      )}
    </div>
  );
});

DebugProductsPage.displayName = 'DebugProductsPage';
