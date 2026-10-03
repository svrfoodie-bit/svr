import toast from 'react-hot-toast';

// Shared display helpers for the CashewFlowX module.

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatCashewFlowXCurrency = (value) => currencyFormatter.format(Number(value) || 0);

export const formatCashewFlowXKg = (value) =>
  `${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} KG`;

// 'YYYY-MM-DD' -> 'DD-MM-YYYY' without going through Date (avoids timezone shifts).
export const formatCashewFlowXDate = (value) => {
  if (!value) return '-';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return d && m && y ? `${d}-${m}-${y}` : String(value);
};

export const cashewFlowXToday = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const calculateCashewFlowXTotal = (quantityKg, pricePerKg) => {
  const qty = parseFloat(quantityKg);
  const price = parseFloat(pricePerKg);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
  return Math.round(qty * price * 100) / 100;
};

export const CASHEW_FLOW_X_BALANCE_BADGE = {
  Outstanding: 'badge-danger',
  Cleared: 'badge-success',
  Advance: 'badge-info',
};

// The API interceptor already toasts HTTP errors; only toast what it didn't handle.
export const notifyCashewFlowXError = (error, fallback) => {
  if (!error?.__toastHandled) toast.error(error?.message || fallback);
};
