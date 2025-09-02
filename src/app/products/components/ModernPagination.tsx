'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
}

export function ModernPagination({
  pagination,
  onPageChange,
}: PaginationProps) {
  const { page, totalPages, hasNext, hasPrev, total } = pagination;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 4) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (page < totalPages - 3) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      {/* Results info */}
      <div className="flex items-center text-sm text-gray-600">
        <span>
          Showing page {page} of {totalPages} ({total.toLocaleString()} total
          products)
        </span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            hasPrev
              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="px-3 py-2">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pageNum === page
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            hasNext
              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
