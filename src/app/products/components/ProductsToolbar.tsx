'use client';

import { Search, Filter, Grid, List, RotateCcw } from 'lucide-react';
import { ProcessedSearchParams } from '../params';

interface ProductsToolbarProps {
  params: ProcessedSearchParams;
  onParamsUpdate: (updates: Partial<ProcessedSearchParams>) => void;
  onReset: () => void;
  isLoading: boolean;
  totalCount: number;
}

export function ProductsToolbar({
  params,
  onParamsUpdate,
  onReset,
  isLoading,
  totalCount,
}: ProductsToolbarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Debounce search in real implementation
    onParamsUpdate({ search: value || undefined });
  };

  const toggleViewMode = () => {
    onParamsUpdate({ 
      viewMode: params.viewMode === 'grid' ? 'list' : 'grid' 
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc'];
    onParamsUpdate({ 
      sortBy: sortBy as any,
      sortOrder 
    });
  };

  return (
    <div className="space-y-4">
      {/* Top row - Search, Filters, View controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={params.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Quick filters */}
          <select
            value={params.status || ''}
            onChange={(e) => onParamsUpdate({ status: e.target.value as any || undefined })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="private">Private</option>
          </select>

          <select
            value={params.type || ''}
            onChange={(e) => onParamsUpdate({ type: e.target.value as any || undefined })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">All Types</option>
            <option value="simple">Simple</option>
            <option value="variable">Variable</option>
            <option value="grouped">Grouped</option>
          </select>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={isLoading}
            title="Reset filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={toggleViewMode}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={isLoading}
            title={`Switch to ${params.viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {params.viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </button>

          {/* Sort */}
          <select
            value={`${params.sortBy}-${params.sortOrder}`}
            onChange={handleSortChange}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="updatedAt-desc">Recently Updated</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="basePrice-asc">Price Low-High</option>
            <option value="basePrice-desc">Price High-Low</option>
            <option value="sku-asc">SKU A-Z</option>
            <option value="sku-desc">SKU Z-A</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {isLoading ? (
          <span>Loading products...</span>
        ) : (
          <span>
            Showing {totalCount} product{totalCount !== 1 ? 's' : ''}
            {params.search && ` for "${params.search}"`}
          </span>
        )}
      </div>
    </div>
  );
}
