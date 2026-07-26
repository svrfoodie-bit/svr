import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Detects unsaved form changes and warns the user before they navigate away.
 *
 * Usage:
 *   const { isDirty, markDirty, markClean, ConfirmDialog } = useUnsavedChanges();
 *
 *   - Call markDirty() whenever the form is modified.
 *   - Call markClean() right before programmatic navigation (after a successful save).
 *   - Render <ConfirmDialog /> inside your component's JSX.
 */
const useUnsavedChanges = () => {
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingPath = useRef(null);
  const pendingCallback = useRef(null);
  const navigate = useNavigate();

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  // Browser tab close / reload warning
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /**
   * Call this instead of navigate(path) to get the unsaved-changes check.
   */
  const safeNavigate = useCallback((path) => {
    if (isDirty) {
      pendingPath.current = path;
      setShowDialog(true);
    } else {
      navigate(path);
    }
  }, [isDirty, navigate]);

  /**
   * Call this to wrap any callback (e.g. onClickCancel) with the unsaved-changes check.
   */
  const safeCallback = useCallback((cb) => {
    if (isDirty) {
      pendingCallback.current = cb;
      setShowDialog(true);
    } else {
      cb();
    }
  }, [isDirty]);

  const handleConfirm = () => {
    setIsDirty(false);
    setShowDialog(false);
    if (pendingPath.current) {
      navigate(pendingPath.current);
      pendingPath.current = null;
    }
    if (pendingCallback.current) {
      pendingCallback.current();
      pendingCallback.current = null;
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    pendingPath.current = null;
    pendingCallback.current = null;
  };

  const ConfirmDialog = () => {
    if (!showDialog) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Unsaved Changes</h3>
              <p className="text-sm text-gray-600">You have unsaved changes. If you leave now, your changes will be lost.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors text-sm"
            >
              Leave & Discard
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-sm"
            >
              Stay & Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { isDirty, markDirty, markClean, safeNavigate, safeCallback, ConfirmDialog };
};

export default useUnsavedChanges;
