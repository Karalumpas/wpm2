'use client';

import { useState, useEffect } from 'react';
import { Search, Grid, List, RotateCcw } from 'lucide-react';
import { ProcessedSearchParams } from '../params';
import { MultiSelectFilter } from './MultiSelectFilter';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface ProductsToolbarProps {
  params: ProcessedSearchParams;
  onParamsUpdate: (updates: Partial<ProcessedSearchParams>) => void;
  onReset: () => void;
  isLoading: boolean;
  totalCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursor?: string;
    nextCursor?: string;
  };
  onPageChange?: (page: number) => void;
}

export function ProductsToolbar({
  params,
  onParamsUpdate,
  onReset,
  isLoading,
  totalCount,
  pagination,
  onPageChange,
}: ProductsToolbarProps) {
  const [searchValue, setSearchValue] = useState(params.search || '');

  // Filter options state
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [shops, setShops] = useState<FilterOption[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      setFiltersLoading(true);
      try {
        const [brandsRes, categoriesRes, shopsRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/categories'),
          fetch('/api/shops'),
        ]);

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData.brands || []);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          setShops(shopsData.shops || []);
        }
      } catch (error) {
        console.error('Failed to load filter options:', error);
      } finally {
        setFiltersLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

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
      viewMode: params.viewMode === 'grid' ? 'list' : 'grid',
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('-') as [
      string,
      'asc' | 'desc',
    ];
    onParamsUpdate({
      sortBy: sortBy as
        | 'updatedAt'
        | 'createdAt'
        | 'name'
        | 'basePrice'
        | 'sku'
        | 'status'
        | 'type'
        | 'stockQuantity'
        | 'weight'
        | 'variantCount',
      sortOrder,
    });
  };

  // Filter selection change handlers
  const handleBrandSelectionChange = (selectedIds: string[]) => {
    onParamsUpdate({ brandIds: selectedIds, page: 1 });
  };

  const handleCategorySelectionChange = (selectedIds: string[]) => {
    onParamsUpdate({ categoryIds: selectedIds, page: 1 });
  };

  const handleShopSelectionChange = (selectedIds: string[]) => {
    onParamsUpdate({ shopIds: selectedIds, page: 1 });
  };

  // Check if any filters are active
  const hasActiveFilters =
    params.brandIds.length > 0 ||
    params.categoryIds.length > 0 ||
    params.shopIds.length > 0 ||
    params.status ||
    params.type ||
    params.search;

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination && pagination.hasPrev && onPageChange) {
      onPageChange(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.hasNext && onPageChange) {
      onPageChange(pagination.page + 1);
    }
  };

  const handlePageJump = (page: number) => {
    if (
      onPageChange &&
      page >= 1 &&
      pagination &&
      page <= pagination.totalPages
    ) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top Section: Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white border-b border-blue-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {totalCount.toLocaleString()} total products
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={handlePreviousPage}
                disabled={!pagination.hasPrev || isLoading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* Page numbers - show current and nearby pages */}
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const startPage = Math.max(1, pagination.page - 2);
                    const page = startPage + i;
                    if (page > pagination.totalPages) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageJump(page)}
                        disabled={isLoading}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Next button */}
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNext || isLoading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>

              {/* Items per page */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={params.limit}
                  onChange={(e) =>
                    onParamsUpdate({ limit: parseInt(e.target.value), page: 1 })
                  }
                  className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar Section */}
      <div className="p-6 space-y-6">
        {/* Search and Actions Row */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <button
              onClick={toggleViewMode}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 rounded-lg border-2 border-gray-300 hover:border-blue-300 transition-colors"
              disabled={isLoading}
              title={`Switch to ${params.viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {params.viewMode === 'grid' ? (
                <List className="h-5 w-5" />
              ) : (
                <Grid className="h-5 w-5" />
              )}
            </button>

            {/* Reset button */}
            <button
              onClick={onReset}
              className="px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg border-2 border-gray-300 hover:border-red-300 transition-colors flex items-center gap-2"
              disabled={isLoading}
              title="Reset all filters"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm font-medium">Reset</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={params.status || ''}
              onChange={(e) =>
                onParamsUpdate({
                  status:
                    (e.target.value as 'published' | 'draft' | 'private') ||
                    undefined,
                  page: 1,
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isLoading}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select
              value={params.type || ''}
              onChange={(e) =>
                onParamsUpdate({
                  type:
                    (e.target.value as 'simple' | 'variable' | 'grouped') ||
                    undefined,
                  page: 1,
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isLoading}
            >
              <option value="">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">Grouped</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Brands</label>
            <MultiSelectFilter
              options={brands}
              selectedIds={params.brandIds || []}
              onSelectionChange={handleBrandSelectionChange}
              placeholder="Select brands..."
              isLoading={filtersLoading}
              compact={true}
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Categories
            </label>
            <MultiSelectFilter
              options={categories}
              selectedIds={params.categoryIds || []}
              onSelectionChange={handleCategorySelectionChange}
              placeholder="Select categories..."
              isLoading={filtersLoading}
              compact={true}
            />
          </div>

          {/* Shop Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Shops</label>
            <MultiSelectFilter
              options={shops}
              selectedIds={params.shopIds || []}
              onSelectionChange={handleShopSelectionChange}
              placeholder="Select shops..."
              isLoading={filtersLoading}
              compact={true}
            />
          </div>
        </div>

        {/* Sort and Results Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-4 border-t border-blue-100">
          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              value={`${params.sortBy}-${params.sortOrder}`}
              onChange={handleSortChange}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[180px]"
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
              <option value="status-asc">Status A-Z</option>
            </select>
          </div>

          {/* Results info */}
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="text-blue-600 font-medium">
                Loading products...
              </span>
            ) : (
              <span>
                Showing{' '}
                <span className="font-semibold text-gray-900">
                  {totalCount.toLocaleString()}
                </span>{' '}
                product{totalCount !== 1 ? 's' : ''}
                {params.search && (
                  <>
                    {' '}
                    for &ldquo;
                    <span className="font-semibold text-blue-600">
                      {params.search}
                    </span>
                    &rdquo;
                  </>
                )}
                {hasActiveFilters && (
                  <span className="text-amber-600 ml-2">(filtered)</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
