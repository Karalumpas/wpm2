'use client';

import { useState, useEffect } from 'react';
import { Search, Grid, List, RotateCcw } from 'lucide-react';
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
  const [searchValue, setSearchValue] = useState(params.search || '');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onParamsUpdate({ search: searchValue || undefined });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchValue, onParamsUpdate]);

  // Update local search value when params change (e.g., reset)
  useEffect(() => {
    setSearchValue(params.search || '');
  }, [params.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const toggleViewMode = () => {
    onParamsUpdate({ 
      viewMode: params.viewMode === 'grid' ? 'list' : 'grid' 
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc'];
    onParamsUpdate({ 
      sortBy: sortBy as 'updatedAt' | 'createdAt' | 'name' | 'basePrice' | 'sku',
      sortOrder 
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
      {/* Top row - Search, Filters, View controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 h-5 w-5 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Quick filters */}
          <select
            value={params.status || ''}
            onChange={(e) => onParamsUpdate({ status: (e.target.value as 'published' | 'draft' | 'private') || undefined })}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[120px]"
            disabled={isLoading}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="private">Private</option>
          </select>

          <select
            value={params.type || ''}
            onChange={(e) => onParamsUpdate({ type: (e.target.value as 'simple' | 'variable' | 'grouped') || undefined })}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[120px]"
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
            className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 rounded-lg border-2 border-gray-300 transition-colors"
            disabled={isLoading}
            title="Reset filters"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <button
            onClick={toggleViewMode}
            className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 rounded-lg border-2 border-gray-300 transition-colors"
            disabled={isLoading}
            title={`Switch to ${params.viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {params.viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
          </button>

          {/* Sort */}
          <select
            value={`${params.sortBy}-${params.sortOrder}`}
            onChange={handleSortChange}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[180px]"
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

      {/* Results count with enhanced styling */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm font-medium text-gray-700">
          {isLoading ? (
            <span className="text-blue-600">Loading products...</span>
          ) : (
            <span>
              Showing <span className="font-semibold text-gray-900">{totalCount}</span> product{totalCount !== 1 ? 's' : ''}
              {params.search && (
                <>
                  {' '}for &ldquo;<span className="font-semibold text-blue-600">{params.search}</span>&rdquo;
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
