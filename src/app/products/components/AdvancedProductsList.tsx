'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Package } from 'lucide-react';
import { ProductListItem } from '@/types/product';
import { ModernProductCard } from './ModernProductCard';

interface AdvancedProductsListProps {
  products: ProductListItem[];
  viewMode: 'grid' | 'list';
  onProductDuplicate?: (productId: string) => void;
  onProductDelete?: (productId: string) => void;
  onProductSync?: (productId: string) => void;
  onBulkSelect?: (selectedIds: string[]) => void;
  className?: string;
}

export function AdvancedProductsList({
  products,
  viewMode,
  onProductDuplicate,
  onProductDelete,
  onProductSync,
  onBulkSelect,
  className = '',
}: AdvancedProductsListProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Memoize product IDs to prevent unnecessary re-renders
  const productIds = useMemo(() => products.map(p => p.id), [products]);

  // Notify parent when selection changes
  const selectedIds = useMemo(() => Array.from(selectedProducts), [selectedProducts]);
  
  useEffect(() => {
    onBulkSelect?.(selectedIds);
  }, [selectedIds, onBulkSelect]);

  const handleSelectProduct = useCallback((productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedProducts(new Set(productIds));
  }, [productIds]);

  const handleDeselectAll = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen produkter fundet</h3>
        <p className="text-gray-500">Prøv at justere dine søge- og filterkriterier.</p>
      </div>
    );
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {products.map((product) => (
          <ModernProductCard
            key={product.id}
            product={product}
            viewMode="list"
            isSelected={selectedProducts.has(product.id)}
            onSelectionChange={handleSelectProduct}
          />
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 ${className}`}>
      {products.map((product) => (
        <ModernProductCard
          key={product.id}
          product={product}
          viewMode="grid"
          isSelected={selectedProducts.has(product.id)}
          onSelectionChange={handleSelectProduct}
        />
      ))}
    </div>
  );
}
