import { useState, useMemo } from 'react';

/**
 * Client-side sort helper.
 *
 * Usage:
 *   const { sortKey, sortDir, setSort, sorted } = useSort(data, 'createdAt', 'desc');
 *
 * In your column header:
 *   <SortHeader col="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
 */
const useSort = (data = [], defaultKey = '', defaultDir = 'asc') => {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const setSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      // Numeric
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      // Date strings
      const da = Date.parse(av), db = Date.parse(bv);
      if (!isNaN(da) && !isNaN(db)) {
        return sortDir === 'asc' ? da - db : db - da;
      }
      // String
      av = String(av ?? '').toLowerCase();
      bv = String(bv ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  return { sortKey, sortDir, setSort, sorted };
};

export default useSort;
