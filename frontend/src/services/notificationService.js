import { finishedGoodsStockService } from './finishedGoodsStockService';
import { jobWorkService } from './jobWorkService';
import { salesPaymentService } from './salesPaymentService';
import { customerService } from './customerService';

/**
 * Generates real-time notifications from live DB data.
 * Returns array of { id, title, message, time, unread, type }
 */
export const fetchNotifications = async () => {
  const notifications = [];

  const [stockResult, jobWorkResult, paymentsResult, customersResult] = await Promise.allSettled([
    finishedGoodsStockService.getAllEntries(),
    jobWorkService.getAll(),
    salesPaymentService.getAll(),
    customerService.getOutstanding(),
  ]);

  // ── 1. Low Finished Goods Stock ──────────────────────────────────────────
  if (stockResult.status === 'fulfilled') {
    const stocks = Array.isArray(stockResult.value) ? stockResult.value : [];
    const LOW_THRESHOLD = 100; // kg
    const lowItems = stocks.filter(s => (parseFloat(s.quantity) || 0) < LOW_THRESHOLD && (parseFloat(s.quantity) || 0) > 0);
    if (lowItems.length > 0) {
      notifications.push({
        id: 'low-stock',
        title: 'Low Stock Alert',
        message: `${lowItems.length} product${lowItems.length > 1 ? 's' : ''} below ${LOW_THRESHOLD}kg — restock needed`,
        time: 'Now',
        unread: true,
        type: 'alert',
      });
    }
  }

  // ── 2. Pending / In-Progress Job Work ────────────────────────────────────
  if (jobWorkResult.status === 'fulfilled') {
    const jobs = Array.isArray(jobWorkResult.value) ? jobWorkResult.value : [];
    const pending = jobs.filter(j => {
      const s = (j.status || '').toLowerCase();
      return s === 'pending' || s === 'in_progress' || s === 'in progress';
    });
    if (pending.length > 0) {
      notifications.push({
        id: 'job-work-pending',
        title: 'Job Work Pending',
        message: `${pending.length} batch${pending.length > 1 ? 'es' : ''} pending return`,
        time: 'Today',
        unread: true,
        type: 'warning',
      });
    }
  }

  // ── 3. Recent Payments (last 48 hours) ───────────────────────────────────
  if (paymentsResult.status === 'fulfilled') {
    const payments = Array.isArray(paymentsResult.value) ? paymentsResult.value : [];
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recent = payments.filter(p => {
      const d = new Date(p.paymentDate || p.created_at || 0).getTime();
      return d >= cutoff;
    });
    if (recent.length > 0) {
      const total = recent.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      notifications.push({
        id: 'recent-payments',
        title: 'Payments Received',
        message: `${recent.length} payment${recent.length > 1 ? 's' : ''} totalling ₹${total.toLocaleString('en-IN')} in last 48h`,
        time: 'Recent',
        unread: false,
        type: 'info',
      });
    }
  }

  // ── 4. Outstanding Customer Dues ─────────────────────────────────────────
  if (customersResult.status === 'fulfilled') {
    const outstanding = Array.isArray(customersResult.value) ? customersResult.value : [];
    const overdue = outstanding.filter(c => (parseFloat(c.outstandingAmount || c.outstanding_amount) || 0) > 0);
    if (overdue.length > 0) {
      const totalDue = overdue.reduce((sum, c) => sum + (parseFloat(c.outstandingAmount || c.outstanding_amount) || 0), 0);
      notifications.push({
        id: 'outstanding-dues',
        title: 'Outstanding Dues',
        message: `₹${totalDue.toLocaleString('en-IN')} pending from ${overdue.length} customer${overdue.length > 1 ? 's' : ''}`,
        time: 'Check now',
        unread: false,
        type: 'warning',
      });
    }
  }

  return notifications;
};
