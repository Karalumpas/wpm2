'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List, 
  MoreHorizontal,
  CheckSquare,
  Square,
  Copy,
  RefreshCw,
  Trash2,
  Archive,
  Tag,
  X
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDuplicate: () => void;
  onBulkDelete: () => void;
  onBulkSync: () => void;
  onBulkUpdateStatus: (status: string) => void;
  onBulkAddCategory: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDuplicate,
  onBulkDelete,
  onBulkSync,
  onBulkUpdateStatus,
  onBulkAddCategory,
}: BulkActionsToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        {/* Selection info */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={totalCount === 0}
          >
            {selectedCount === totalCount && totalCount > 0 ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} af {totalCount} valgt
          </span>
        </div>

        {selectedCount > 0 && (
          <>
            <div className="h-6 w-px bg-gray-300" />

            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onBulkDuplicate}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Dupliker
              </button>

              <button
                onClick={onBulkSync}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Synkroniser
              </button>

              {/* Status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Tag className="h-4 w-4" />
                  Status
                </button>

                {showStatusMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowStatusMenu(false)}
                    />
                    <div className="absolute bottom-full mb-2 left-0 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          onBulkUpdateStatus('published');
                          setShowStatusMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Udgivet
                      </button>
                      <button
                        onClick={() => {
                          onBulkUpdateStatus('draft');
                          setShowStatusMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Kladde
                      </button>
                      <button
                        onClick={() => {
                          onBulkUpdateStatus('private');
                          setShowStatusMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Privat
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onBulkAddCategory}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Tag className="h-4 w-4" />
                Kategorier
              </button>

              <button
                onClick={onBulkDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Slet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface AdvancedFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filters: {
    status?: string;
    category?: string;
    stockStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onFiltersChange: (filters: Record<string, any>) => void;
}

export function AdvancedFilterToolbar({
  searchTerm,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
}: AdvancedFilterToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Main toolbar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Søg efter produkter..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtre
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            Sorter
          </button>

          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    onSortChange('name', sortOrder);
                    setShowSortMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                >
                  Navn
                </button>
                <button
                  onClick={() => {
                    onSortChange('basePrice', sortOrder);
                    setShowSortMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                >
                  Pris
                </button>
                <button
                  onClick={() => {
                    onSortChange('createdAt', sortOrder);
                    setShowSortMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                >
                  Oprettelsesdato
                </button>
                <button
                  onClick={() => {
                    onSortChange('updatedAt', sortOrder);
                    setShowSortMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                >
                  Senest opdateret
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
                    setShowSortMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? 'Stigende → Faldende' : 'Faldende → Stigende'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 ${
              viewMode === 'grid' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 ${
              viewMode === 'list' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle statusser</option>
                <option value="published">Udgivet</option>
                <option value="draft">Kladde</option>
                <option value="private">Privat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lagerstatus
              </label>
              <select
                value={filters.stockStatus || ''}
                onChange={(e) => onFiltersChange({ ...filters, stockStatus: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle lagerstatusser</option>
                <option value="instock">På lager</option>
                <option value="outofstock">Udsolgt</option>
                <option value="onbackorder">Restordre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fra dato
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Til dato
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onFiltersChange({})}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Nulstil alle filtre
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
