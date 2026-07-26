import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';

const TOAST_STYLES = {
  base: {
    borderRadius: '20px',
    padding: '14px 16px',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
    border: '1px solid transparent',
    minWidth: '320px',
    maxWidth: '460px',
    backdropFilter: 'blur(14px)',
  },
  success: {
    background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(209, 250, 229, 0.95))',
    color: '#14532d',
    borderColor: 'rgba(34, 197, 94, 0.22)',
  },
  error: {
    background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.98), rgba(254, 226, 226, 0.96))',
    color: '#991b1b',
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  default: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96))',
    color: '#0f172a',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
};

const getToastPalette = (type) => {
  if (type === 'success') return TOAST_STYLES.success;
  if (type === 'error') return TOAST_STYLES.error;
  return TOAST_STYLES.default;
};

const getToastIcon = (type) => {
  if (type === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (type === 'error') return <AlertTriangle className="h-5 w-5 text-red-600" />;
  return <Info className="h-5 w-5 text-slate-600" />;
};

const splitMessage = (message = '') => {
  const normalized = String(message).trim();
  const parts = normalized.split(/\n+/).map((item) => item.trim()).filter(Boolean);

  if (parts.length > 1) {
    return {
      title: parts[0],
      detail: parts.slice(1).join(' '),
    };
  }

  const sentenceBreak = normalized.match(/^(.+?[.!?])\s+(.+)$/);
  if (sentenceBreak) {
    return {
      title: sentenceBreak[1],
      detail: sentenceBreak[2],
    };
  }

  if (normalized.length > 84) {
    const splitAt = normalized.lastIndexOf(' ', 84);
    if (splitAt > 24) {
      return {
        title: normalized.slice(0, splitAt),
        detail: normalized.slice(splitAt + 1),
      };
    }
  }

  return {
    title: normalized,
    detail: '',
  };
};

const AppToaster = () => (
  <Toaster
    position="top-right"
    gutter={14}
    containerStyle={{
      top: 20,
      right: 20,
    }}
    toastOptions={{
      duration: 4200,
      style: {
        ...TOAST_STYLES.base,
        ...TOAST_STYLES.default,
      },
      success: {
        duration: 3200,
        style: {
          ...TOAST_STYLES.base,
          ...TOAST_STYLES.success,
        },
      },
      error: {
        duration: 5200,
        style: {
          ...TOAST_STYLES.base,
          ...TOAST_STYLES.error,
        },
      },
    }}
  >
    {(t) => {
      const palette = getToastPalette(t.type);
      const icon = getToastIcon(t.type);
      const { title, detail } = splitMessage(t.message);

      return (
        <ToastBar toast={t}>
          {() => (
            <div
              className="flex items-start gap-3 rounded-[20px] border px-4 py-3.5 shadow-2xl"
              style={{ ...TOAST_STYLES.base, ...palette }}
            >
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5">{title}</p>
                {detail ? (
                  <p className="mt-1 text-sm leading-5 opacity-90">{detail}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="mt-0.5 shrink-0 rounded-full p-1 transition-colors hover:bg-black/5"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </ToastBar>
      );
    }}
  </Toaster>
);

export default AppToaster;
