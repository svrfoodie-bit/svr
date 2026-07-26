import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable pagination component.
 *
 * Props:
 *  - page        {number}   current page (1-based)
 *  - totalPages  {number}   total number of pages
 *  - onPage      {function} called with new page number
 *  - pageSize    {number}   rows per page (optional, for display)
 *  - total       {number}   total record count (optional, for display)
 */
const Pagination = ({ page, totalPages, onPage, pageSize, total }) => {
  if (!totalPages || totalPages <= 1) return null;

  const start = pageSize && total ? (page - 1) * pageSize + 1 : null;
  const end   = pageSize && total ? Math.min(page * pageSize, total) : null;

  // Build visible page numbers: always show first, last, current ±1, with ellipsis
  const buildPages = () => {
    const pages = [];
    const delta = 1;
    const range = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) range.unshift('...');
    if (page + delta < totalPages - 1) range.push('...');

    pages.push(1);
    range.forEach(r => pages.push(r));
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pages = buildPages();

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors';
  const btnActive = 'bg-primary-600 text-white shadow-sm';
  const btnInactive = 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50';
  const btnDisabled = 'bg-white text-gray-300 border border-gray-100 cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white">
      {/* Record count */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        {start && end && total
          ? <>Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{total}</span> records</>
          : <>Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{totalPages}</span></>
        }
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-9 text-center text-gray-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnInactive}`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
