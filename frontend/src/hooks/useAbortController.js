import { useEffect, useRef } from 'react';

/**
 * Returns an AbortController that is automatically aborted when the component unmounts.
 * Use this to cancel in-flight API requests when navigating away quickly.
 *
 * @example
 * const { signal } = useAbortController();
 * useEffect(() => {
 *   fetch('/api/data', { signal }).then(...).catch(err => {
 *     if (err.name !== 'AbortError') setError(err);
 *   });
 * }, []);
 */
const useAbortController = () => {
  const controllerRef = useRef(null);

  if (!controllerRef.current) {
    controllerRef.current = new AbortController();
  }

  useEffect(() => {
    const controller = controllerRef.current;
    return () => controller.abort();
  }, []);

  return controllerRef.current;
};

export default useAbortController;
