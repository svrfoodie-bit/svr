import { useEffect } from 'react';

/**
 * Triggers a save callback when the user presses Ctrl+S (or Cmd+S on Mac).
 *
 * Usage:
 *   useKeyboardSave(handleSubmit);
 *   useKeyboardSave(() => formRef.current?.requestSubmit());
 *
 * @param {Function} onSave - callback to invoke on Ctrl+S
 * @param {boolean} [enabled=true] - set false to disable (e.g. when loading)
 */
const useKeyboardSave = (onSave, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSave, enabled]);
};

export default useKeyboardSave;
