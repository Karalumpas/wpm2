'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ImprovedPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function ImprovedPagination({ pagination, onPageChange }: ImprovedPaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage, total, limit } = pagination;
  
  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, 'dots1');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('dots2', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Showing{' '}
        <span className="font-medium text-gray-900">
          {((page - 1) * limit) + 1}
        </span>{' '}
        to{' '}
        <span className="font-medium text-gray-900">
          {Math.min(page * limit, total)}
        </span>{' '}
        of{' '}
        <span className="font-medium text-gray-900">
          {total.toLocaleString()}
        </span>{' '}
        results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {visiblePages.map((pageNum, index) => {
            if (pageNum === 'dots1' || pageNum === 'dots2') {
              return (
                <div
                  key={`dots-${index}`}
                  className="px-3 py-2 text-gray-400"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            const isCurrentPage = pageNum === page;
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`
                  inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    isCurrentPage
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Quick jump to page (for large datasets) */}
      {totalPages > 10 && (
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Go to page:</label>
          <input
            type="number"
            min={1}
            max={totalPages}
            defaultValue={page}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newPage = parseInt((e.target as HTMLInputElement).value);
                if (newPage >= 1 && newPage <= totalPages) {
                  onPageChange(newPage);
                }
              }
            }}
            className="w-16 px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}