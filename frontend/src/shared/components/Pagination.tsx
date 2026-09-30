import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-zinc-800/80 text-sm text-zinc-400">
      <div>
        {totalElements !== undefined && pageSize !== undefined ? (
          <span>
            Showing <strong className="text-zinc-200">{currentPage * pageSize + 1}</strong> to{' '}
            <strong className="text-zinc-200">{Math.min((currentPage + 1) * pageSize, totalElements)}</strong> of{' '}
            <strong className="text-zinc-200">{totalElements}</strong> items
          </span>
        ) : (
          <span>Page {currentPage + 1} of {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i)
          .filter((page) => page === 0 || page === totalPages - 1 || Math.abs(page - currentPage) <= 1)
          .map((page, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev !== undefined && page - prev > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-2 text-zinc-500">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {page + 1}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
