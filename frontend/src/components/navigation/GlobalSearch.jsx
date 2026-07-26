import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Users, Package, Briefcase, ShoppingCart, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { get } from '../../services/apiHelpers';

const TYPE_ICON = {
  Customer: Users,
  Supplier: Package,
  Worker: Briefcase,
  'Sales Order': ShoppingCart,
  Purchase: Package,
};

const TYPE_COLOR = {
  Customer: 'bg-blue-100 text-blue-700',
  Supplier: 'bg-green-100 text-green-700',
  Worker: 'bg-purple-100 text-purple-700',
  'Sales Order': 'bg-orange-100 text-orange-700',
  Purchase: 'bg-yellow-100 text-yellow-700',
};

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await get('/search', { q });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (result) => {
    navigate(result.url);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (Ctrl+K)"
          className="w-48 md:w-64 pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:w-72 transition-all duration-200"
        />
        {query ? (
          <button onClick={clear} className="absolute right-2.5 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        ) : (
          loading && <Loader size={14} className="absolute right-2.5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 w-80 bg-white rounded-2xl shadow-strong border border-gray-200 z-50 overflow-hidden"
          >
            {loading && results.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                <Loader size={14} className="animate-spin" />
                <span>Searching…</span>
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No results for "{query}"</div>
            ) : (
              <ul>
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type] || Search;
                  const color = TYPE_COLOR[r.type] || 'bg-gray-100 text-gray-700';
                  return (
                    <li key={`${r.type}-${r.id}-${i}`}>
                      <button
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Icon size={16} className="text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                          {r.sub && <p className="text-xs text-gray-500 truncate">{r.sub}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${color}`}>
                          {r.type}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
