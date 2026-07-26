import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, ChevronUp, ChevronDown,
  X, Rocket, ArrowRight, Sparkles,
} from 'lucide-react';
import { useOnboardingStore, STEPS } from '../../context/onboardingStore';
import { useAuthStore } from '../../context/authStore';
import { useCompanyStore } from '../../context/companyStore';

// Detect completed steps by calling the backend — only called once after login
const detectCompleted = async (token) => {
  if (!token) return [];
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  const headers = { Authorization: `Bearer ${token}` };
  const done = [];

  const check = async (url, stepId) => {
    try {
      const res = await fetch(`${base}${url}`, { headers });
      if (!res.ok) return;
      const json = await res.json();
      const arr = json?.data ?? [];
      if (arr.length > 0) done.push(stepId);
    } catch { /* silent */ }
  };

  await Promise.allSettled([
    check('/customers', 'add_customer'),
    check('/raw-purchases', 'add_purchase'),
    check('/workers', 'add_worker'),
    check('/sales-orders', 'add_sales_order'),
  ]);

  return done;
};

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);
  const {
    visible, minimized, dismissed, completed,
    show, minimize, expand, dismiss, syncCompleted, markComplete,
  } = useOnboardingStore();

  const [ready, setReady] = useState(false);

  const completedCount = STEPS.filter((s) => completed[s.id]).length;
  const allDone = completedCount === STEPS.length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  // Run auto-detection once after login
  useEffect(() => {
    if (!isAuthenticated || dismissed) return;

    // Small delay so the app fully hydrates before firing API calls
    const t = setTimeout(async () => {
      const ids = await detectCompleted(token);
      syncCompleted(ids);
      // Mark "explore dashboard" as done always (they're already here)
      syncCompleted(['explore_dashboard']);
      if (!dismissed) show();
      setReady(true);
    }, 1200);

    return () => clearTimeout(t);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-close after all done
  useEffect(() => {
    if (allDone && visible && !minimized) {
      const t = setTimeout(dismiss, 5000);
      return () => clearTimeout(t);
    }
  }, [allDone, visible, minimized]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || dismissed || !visible || !ready) return null;

  const handleStep = (step) => {
    markComplete(step.id);
    navigate(step.path);
    if (window.innerWidth < 1024) minimize();
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-80">
      <AnimatePresence mode="wait">
        {minimized ? (
          /* ── Minimised pill ─────────────────────────────────────────── */
          <motion.button
            key="pill"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={expand}
            className="ml-auto flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="relative">
              <Rocket className="w-4 h-4 text-primary-600" />
              {!allDone && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              Setup {completedCount}/{STEPS.length}
            </span>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          </motion.button>
        ) : (
          /* ── Expanded panel ─────────────────────────────────────────── */
          <motion.div
            key="panel"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-500 px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {allDone
                    ? <Sparkles className="w-4 h-4 text-white" />
                    : <Rocket className="w-4 h-4 text-white" />
                  }
                  <span className="text-sm font-bold text-white">
                    {allDone ? 'Setup Complete!' : 'Getting Started'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={minimize}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={dismiss}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs text-white/80 font-semibold flex-shrink-0">
                  {completedCount}/{STEPS.length}
                </span>
              </div>
            </div>

            {/* All done */}
            {allDone ? (
              <div className="px-4 py-8 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <p className="text-base font-bold text-gray-800">You're all set!</p>
                <p className="text-xs text-gray-500 mt-1">
                  {companyName} is fully configured and ready.
                </p>
                <button
                  onClick={dismiss}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            ) : (
              /* Steps list */
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {STEPS.map((step, i) => {
                  const done = !!completed[step.id];
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        done ? 'opacity-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {done
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <Circle className="w-5 h-5 text-gray-300" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${
                          done ? 'line-through text-gray-400' : 'text-gray-800'
                        }`}>
                          {step.title}
                        </p>
                        {!done && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                            {step.description}
                          </p>
                        )}
                      </div>

                      {!done && (
                        <button
                          onClick={() => handleStep(step)}
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors"
                        >
                          {step.cta}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {!allDone && (
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {STEPS.length - completedCount} step{STEPS.length - completedCount !== 1 ? 's' : ''} remaining
                </span>
                <button
                  onClick={dismiss}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
