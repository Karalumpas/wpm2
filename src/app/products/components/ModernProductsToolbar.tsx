'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  X,
  Package,
  Tag,
  Store,
  Star,
  TrendingUp,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { ProcessedSearchParams } from '../params';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface ModernProductsToolbarProps {
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
}

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A-Z', icon: Package },
  { value: 'name-desc', label: 'Name Z-A', icon: Package },
  { value: 'basePrice-asc', label: 'Price Low-High', icon: TrendingUp },
  { value: 'basePrice-desc', label: 'Price High-Low', icon: TrendingUp },
  { value: 'createdAt-desc', label: 'Newest First', icon: Star },
  { value: 'createdAt-asc', label: 'Oldest First', icon: Star },
];

const STATUS_OPTIONS = [
  {
    value: 'published',
    label: 'Published',
    color: 'bg-green-100 text-green-800',
  },
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  {
    value: 'private',
    label: 'Private',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    value: 'pending',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
  },
];

const TYPE_OPTIONS = [
  { value: 'simple', label: 'Simple Product' },
  { value: 'variable', label: 'Variable Product' },
  { value: 'grouped', label: 'Grouped Product' },
  { value: 'external', label: 'External Product' },
];

export function ModernProductsToolbar({
  params,
  onParamsUpdate,
  onReset,
  isLoading,
  totalCount,
  pagination,
}: ModernProductsToolbarProps) {
  const [searchValue, setSearchValue] = useState(params.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

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
      onParamsUpdate({ search: searchValue || undefined, page: 1 });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onParamsUpdate]);

  // Update local search value when params change
  useEffect(() => {
    setSearchValue(params.search || '');
  }, [params.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onParamsUpdate({ search: undefined, page: 1 });
  };

  const currentSort = `${params.sortBy}-${params.sortOrder}`;
  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === currentSort)?.label || 'Name A-Z';

  const handleSortChange = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split('-');
    onParamsUpdate({
      sortBy: sortBy as 'name' | 'basePrice' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1,
    });
    setShowSortMenu(false);
  };

  const handleViewModeChange = (viewMode: 'grid' | 'list') => {
    onParamsUpdate({ viewMode });
  };

  const handleStatusFilter = (status: string) => {
    onParamsUpdate({
      status:
        params.status === status
          ? undefined
          : (status as 'published' | 'draft' | 'private'),
      page: 1,
    });
  };

  const handleTypeFilter = (type: string) => {
    onParamsUpdate({
      type:
        params.type === type
          ? undefined
          : (type as 'simple' | 'variable' | 'grouped'),
      page: 1,
    });
  };

  const activeFiltersCount = [
    params.search && 1,
    params.status && 1,
    params.type && 1,
    params.brandIds.length,
    params.categoryIds.length,
    params.shopIds.length,
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Main Toolbar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Search and Filters */}
          <div className="flex items-center gap-3 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchValue && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              {STATUS_OPTIONS.slice(0, 2).map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusFilter(status.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    params.status === status.value
                      ? status.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Section - Sort and View Options */}
          <div className="flex items-center gap-3">
            {/* Results Count */}
            <div className="text-sm text-gray-600 hidden sm:block">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
              ) : (
                <span>
                  {totalCount.toLocaleString()} product
                  {totalCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
              >
                <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {currentSortLabel}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    {SORT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                            currentSort === option.value
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-all ${
                  params.viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-all ${
                  params.viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={onReset}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                title="Reset all filters"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusFilter(status.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      params.status === status.value
                        ? status.color
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeFilter(type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      params.type === type.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brands
              </label>
              {filtersLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
              ) : (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const brandId = e.target.value;
                    onParamsUpdate({
                      brandIds: brandId ? [brandId] : [],
                      page: 1,
                    });
                  }}
                  value={params.brandIds[0] || ''}
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} {brand.count && `(${brand.count})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              {filtersLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
              ) : (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    onParamsUpdate({
                      categoryIds: categoryId ? [categoryId] : [],
                      page: 1,
                    });
                  }}
                  value={params.categoryIds[0] || ''}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} {category.count && `(${category.count})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Active filters:</span>
                  <span className="font-medium">{activeFiltersCount}</span>
                </div>
                <button
                  onClick={onReset}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showSortMenu || showFilters) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowSortMenu(false);
          }}
        />
      )}
    </div>
  );
}
