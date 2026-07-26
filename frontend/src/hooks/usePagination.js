import { useState, useMemo } from 'react';

/**
 * Client-side pagination helper.
 *
 * Usage:
 *   const { page, pageSize, setPage, paginated, totalPages } = usePagination(data, 25);
 *
 * Returns:
 *   page        - current page (1-based)
 *   pageSize    - rows per page
 *   setPage     - change page
 *   paginated   - sliced array for current page
 *   totalPages  - total number of pages
 *   total       - total record count (= data.length)
 */
const usePagination = (data = [], defaultPageSize = 25) => {
  const [page, setPageRaw] = useState(1);
  const [pageSize] = useState(defaultPageSize);

  const total      = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setPage = (p) => {
    setPageRaw(Math.min(Math.max(1, p), totalPages));
  };

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  return { page, pageSize, setPage, paginated, totalPages, total };
};

export default usePagination;
