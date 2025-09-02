'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProcessedSearchParams } from '../params';
import { AdvancedFilterToolbar } from './AdvancedToolbar';
import { AdvancedProductsList } from './AdvancedProductsList';
import { ModernPagination } from './ModernPagination';
import { useProducts } from '../hooks/useProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface NewProductsPageProps {
  initialParams: ProcessedSearchParams;
}

export function NewProductsPage({ initialParams }: NewProductsPageProps) {
  const router = useRouter();
  
  // Local state for search and filters
  const [searchTerm, setSearchTerm] = useState(initialParams.search || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState(initialParams.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialParams.sortOrder || 'asc');
  const [itemsPerPage, setItemsPerPage] = useState(initialParams.limit || 24);
  const [filters, setFilters] = useState({
    status: initialParams.status,
    stockStatus: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });
  
  // Build params for API call
  const apiParams = useMemo(() => ({
    ...initialParams,
    search: searchTerm,
    sortBy,
    sortOrder,
    limit: itemsPerPage,
    status: filters.status,
    // Add other filters as needed
  }), [initialParams, searchTerm, sortBy, sortOrder, itemsPerPage, filters]);

  // Fetch products
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useProducts(apiParams);

  const products = data?.products || [];

  // Individual product actions
  const handleProductDuplicate = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        router.push(`/products/${result.newProductId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Kunne ikke duplikere produkt');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('En fejl opstod');
    }
  }, [router]);

  const handleProductDelete = useCallback(async (productId: string) => {
    if (!confirm('Er du sikker på, at du vil slette dette produkt?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Produkt slettet');
        mutate();
      } else {
        const error = await response.json();
        alert(error.error || 'Kunne ikke slette produkt');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('En fejl opstod');
    }
  }, [mutate]);

  const handleProductSync = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        mutate();
      } else {
        const error = await response.json();
        alert(error.error || 'Kunne ikke synkronisere produkt');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('En fejl opstod');
    }
  }, [mutate]);

  // Remove unused selection handlers since bulk actions are gone
  // const handleSelectAll = useCallback(() => {
  //   setSelectedProductIds(products.map((p: { id: string }) => p.id));
  // }, [products]);

  // const handleDeselectAll = useCallback(() => {
  //   setSelectedProductIds([]);
  // }, []);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Der opstod en fejl ved indlæsning af produkter. Prøv at genindlæse siden.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Filter Toolbar */}
      <AdvancedFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortBy(field as typeof sortBy);
          setSortOrder(order);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters as typeof filters)}
      />

      {/* Top Pagination - Temporarily always show for testing */}
      {data?.pagination && (
        <ModernPagination
          pagination={data.pagination}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(limit) => {
            setItemsPerPage(limit);
            // Reset to page 1 when changing items per page
            const url = new URL(window.location.href);
            url.searchParams.set('limit', limit.toString());
            url.searchParams.delete('page');
            router.push(url.toString());
          }}
          onPageChange={(page) => {
            const url = new URL(window.location.href);
            url.searchParams.set('page', page.toString());
            router.push(url.toString());
          }}
        />
      )}

      {/* Products List */}
      <AdvancedProductsList
        products={products}
        viewMode={viewMode}
        onProductDuplicate={handleProductDuplicate}
        onProductDelete={handleProductDelete}
        onProductSync={handleProductSync}
      />

      {/* Bottom Pagination - Temporarily always show for testing */}
      {data?.pagination && (
        <ModernPagination
          pagination={data.pagination}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(limit: number) => {
            setItemsPerPage(limit);
            // Reset to page 1 when changing items per page
            const url = new URL(window.location.href);
            url.searchParams.set('limit', limit.toString());
            url.searchParams.delete('page');
            router.push(url.toString());
          }}
          onPageChange={(page) => {
            const url = new URL(window.location.href);
            url.searchParams.set('page', page.toString());
            router.push(url.toString());
          }}
        />
      )}
    </div>
  );
}
