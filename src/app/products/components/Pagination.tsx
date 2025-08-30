'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { PaginationInfo } from '@/types/product';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNext, hasPrev } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className="flex items-center justify-center space-x-1"
      aria-label="Pagination"
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Previous</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <span
                key={`dots-${index}`}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }

          const isCurrentPage = pageNum === page;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum as number)}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isCurrentPage
                  ? 'z-10 bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isCurrentPage ? 'page' : undefined}
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
        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <span className="mr-1 hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Page info */}
      <div className="hidden md:flex items-center ml-6 text-sm text-gray-700">
        Showing page {page} of {totalPages}
        {pagination.total && (
          <span className="ml-2 text-gray-500">
            ({pagination.total.toLocaleString()} total)
          </span>
        )}
      </div>
    </nav>
  );
}
