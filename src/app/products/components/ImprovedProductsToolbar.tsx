'use client';

import { useState } from 'react';
import { ProcessedSearchParams } from '../params';
import { MultiSelectFilter } from './MultiSelectFilter';
import { Pagination } from './ImprovedPagination';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List, 
  RotateCcw,
  ChevronDown,
  Settings2,
  Download,
  Upload
} from 'lucide-react';

interface ImprovedProductsToolbarProps {
  params: ProcessedSearchParams;
  onParamsUpdate: (updates: Partial<ProcessedSearchParams>) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalCount: number;
  stats: {
    total: number;
    published: number;
    draft: number;
    totalValue: string;
    showing: number;
  };
  pagination?: Pagination | undefined;
  onPageChange: (page: number) => void;
}

export function ImprovedProductsToolbar({
  params,
  onParamsUpdate,
  onReset,
  onRefresh,
  isLoading,
  totalCount,
  stats,
  pagination,
  onPageChange,
}: ImprovedProductsToolbarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(params.search || '');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onParamsUpdate({ search: value || undefined, page: 1 });
  };

  const allowedSorts = ['name','basePrice','sku','createdAt','updatedAt','status','type','stockQuantity','weight','variantCount'] as const;
  type SortKey = typeof allowedSorts[number];
  const handleSortChange = (sortBy: SortKey) => {
    const newOrder = params.sortBy === sortBy && params.sortOrder === 'asc' ? 'desc' : 'asc';
    onParamsUpdate({ sortBy, sortOrder: newOrder, page: 1 });
  };

  const activeFiltersCount = [
    !!params.status,
    !!params.type,
    (params.brandIds && params.brandIds.length > 0) || false,
    (params.categoryIds && params.categoryIds.length > 0) || false,
    (params.shopIds && params.shopIds.length > 0) || false,
    !!params.search,
  ].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      {/* Top Row - Search and Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 font-medium ${
              showAdvancedFilters || activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden">
            <button
              onClick={() => onParamsUpdate({ viewMode: 'grid' })}
              className={`p-3 transition-all duration-200 ${
                params.viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => onParamsUpdate({ viewMode: 'list' })}
              className={`p-3 transition-all duration-200 ${
                params.viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <select
              value={`${params.sortBy}-${params.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                onParamsUpdate({ sortBy: sortBy as SortKey, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
              }}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="basePrice-asc">Price (Low to High)</option>
              <option value="basePrice-desc">Price (High to Low)</option>
              <option value="sku-asc">SKU (A-Z)</option>
              <option value="sku-desc">SKU (Z-A)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={params.status || 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  onParamsUpdate({
                    status: val === 'all' ? undefined : (val as 'published' | 'draft' | 'private'),
                    page: 1,
                  });
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={params.type || 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  onParamsUpdate({
                    type: val === 'all' ? undefined : (val as 'simple' | 'variable' | 'grouped'),
                    page: 1,
                  });
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="simple">Simple</option>
                <option value="variable">Variable</option>
                <option value="grouped">Grouped</option>
              </select>
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Per Page</label>
              <select
                value={params.limit}
                onChange={(e) => onParamsUpdate({ limit: parseInt(e.target.value), page: 1 })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={12}>12 items</option>
                <option value={24}>24 items</option>
                <option value={48}>48 items</option>
                <option value={96}>96 items</option>
              </select>
            </div>

            {/* Pagination Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pagination</label>
              <select
                value={params.paginationMode as string}
                onChange={(e) => {
                  const val = e.target.value;
                  onParamsUpdate({ paginationMode: val as 'pages' | 'loadMore', page: 1 });
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pages">Page Numbers</option>
                <option value="loadMore">Load More</option>
              </select>
            </div>
          </div>

          {/* Multi-select filters can be added here */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Additional filters like brands, categories, and shops can be implemented here using the existing MultiSelectFilter component.
            </p>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-4">
          <span>
            Showing <span className="font-medium text-gray-900">{stats.showing}</span> of{' '}
            <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span> products
          </span>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              <span>Loading...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="h-4 w-4" />
            Bulk Actions
          </button>
        </div>
      </div>
    </div>
  );
}