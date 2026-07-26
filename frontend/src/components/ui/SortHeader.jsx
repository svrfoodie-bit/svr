import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * A <th> that shows sort arrows and calls onSort(col) on click.
 *
 * Props:
 *   col      - the data key this column sorts by
 *   label    - display text
 *   sortKey  - currently active sort key (from useSort)
 *   sortDir  - 'asc' | 'desc' (from useSort)
 *   onSort   - setter (from useSort)
 *   align    - 'left' | 'right' | 'center' (default 'left')
 *   className - extra classes passed to <th>
 */
const SortHeader = ({ col, label, sortKey, sortDir, onSort, align = 'left', className = '' }) => {
  const active = sortKey === col;
  const Icon = active ? (sortDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;

  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      className={`px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors ${alignClass} ${className}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon
          size={14}
          className={active ? 'text-primary-600' : 'text-gray-400'}
        />
      </span>
    </th>
  );
};

export default SortHeader;
