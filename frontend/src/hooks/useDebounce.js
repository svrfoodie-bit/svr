import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (default 300ms).
 * Use for search inputs to avoid firing on every keystroke.
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

export { useDebounce };
export default useDebounce;
