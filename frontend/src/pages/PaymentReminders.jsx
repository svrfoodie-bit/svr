import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Search, FileDown, Phone, X, Send, MessageSquare, Check,
  ChevronDown, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { salesOrderService } from '../services/salesOrderService';
import { useCompanyStore } from '../context/companyStore';

// ── WhatsApp icon (SVG — not in lucide) ───────────────────────────────────────
const WhatsAppIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const calcUrgency = (date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days > 30) return 'OVERDUE';
  if (days > 15) return 'DUE_SOON';
  return 'UPCOMING';
};

const buildMessage = (r, companyName) =>
  `Dear ${r.party},\n\nThis is a friendly reminder that *₹${fmt(r.outstandingAmount)}* is pending against ${r.referenceNo || 'your account'} dated ${fmtDate(r.date)} (${r.daysPending} days).\n\nKindly arrange the payment at the earliest.\n\nThank you,\n*${companyName}*`;

const openWhatsApp = (phone, message) => {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean || clean.length < 10) {
    toast.error('No valid phone number for this contact');
    return false;
  }
  const num = clean.length === 10 ? `91${clean}` : clean;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
  return true;
};

const URGENCY = {
  OVERDUE:  { label: 'Overdue',  cls: 'bg-red-100 text-red-700 border-red-200',       icon: XCircle,      dot: 'bg-red-500' },
  DUE_SOON: { label: 'Due Soon', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle,  dot: 'bg-amber-500' },
  UPCOMING: { label: 'Recent',   cls: 'bg-blue-100 text-blue-700 border-blue-200',     icon: Clock,        dot: 'bg-blue-500' },
};

// ── Message Preview Modal ─────────────────────────────────────────────────────
const MessageModal = ({ reminder, companyName, onClose, onSend }) => {
  const [msg, setMsg] = useState(buildMessage(reminder, companyName));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-[#075E54] text-white">
          <WhatsAppIcon className="w-5 h-5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{reminder.party}</p>
            <p className="text-xs text-white/70">{reminder.contactNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Chat bubble preview */}
        <div className="bg-[#e5ddd5] p-4">
          <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 shadow-sm max-w-[85%] text-sm text-gray-800 whitespace-pre-line leading-relaxed">
            {msg}
          </div>
        </div>

        {/* Editable message */}
        <div className="p-4 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Edit message</label>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            rows={6}
            className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3 gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSend(msg)}
              className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PaymentReminders() {
  const [reminders, setReminders]   = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [urgencyF, setUrgencyF]     = useState('ALL');
  const [selected, setSelected]     = useState(new Set());
  const [sent, setSent]             = useState(new Set());       // IDs that had WA opened
  const [modal, setModal]           = useState(null);            // reminder for preview
  const [bulkLoading, setBulkLoading] = useState(false);
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await salesOrderService.getAll({ timeRange: 'YEAR' });
      const list = orders
        .filter(o => (parseFloat(o.totalAmount) - parseFloat(o.paidAmount || 0)) > 0)
        .map(o => {
          const outstanding = parseFloat(o.totalAmount) - parseFloat(o.paidAmount || 0);
          const days = Math.floor((Date.now() - new Date(o.orderDate || o.createdAt).getTime()) / 86400000);
          return {
            id: o.id || o._id,
            referenceNo: o.orderNumber,
            party: o.customerName,
            contactNumber: o.customerPhone || o.contactNumber || '',
            date: o.orderDate || o.createdAt,
            totalAmount: parseFloat(o.totalAmount),
            paidAmount: parseFloat(o.paidAmount || 0),
            outstandingAmount: outstanding,
            daysPending: days,
            urgency: calcUrgency(o.orderDate || o.createdAt),
          };
        })
        .sort((a, b) => {
          const u = { OVERDUE: 0, DUE_SOON: 1, UPCOMING: 2 };
          return u[a.urgency] - u[b.urgency] || b.outstandingAmount - a.outstandingAmount;
        });
      setReminders(list);
    } catch {
      toast.error('Failed to load outstanding payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Apply filters
  useEffect(() => {
    let f = reminders;
    if (urgencyF !== 'ALL') f = f.filter(r => r.urgency === urgencyF);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(r => r.party?.toLowerCase().includes(q) || r.referenceNo?.toLowerCase().includes(q) || r.contactNumber?.includes(q));
    }
    setFiltered(f);
  }, [reminders, urgencyF, search]);

  // Metrics
  const metrics = {
    total: reminders.reduce((s, r) => s + r.outstandingAmount, 0),
    overdue: reminders.filter(r => r.urgency === 'OVERDUE'),
    dueSoon: reminders.filter(r => r.urgency === 'DUE_SOON'),
    upcoming: reminders.filter(r => r.urgency === 'UPCOMING'),
  };

  // Selection
  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));

  // Single send
  const handleSend = (reminder, msg) => {
    const ok = openWhatsApp(reminder.contactNumber, msg);
    if (ok) {
      setSent(prev => new Set([...prev, reminder.id]));
      toast.success(`WhatsApp opened for ${reminder.party}`);
    }
    setModal(null);
  };

  // Bulk send — opens WA tabs with 800ms gap (browsers block rapid popups)
  const handleBulkSend = async () => {
    const targets = filtered.filter(r => selected.has(r.id));
    if (!targets.length) { toast.error('Select at least one contact'); return; }
    setBulkLoading(true);
    let sent_count = 0;
    for (const r of targets) {
      const ok = openWhatsApp(r.contactNumber, buildMessage(r, companyName));
      if (ok) { sent_count++; setSent(prev => new Set([...prev, r.id])); }
      if (targets.indexOf(r) < targets.length - 1) await new Promise(res => setTimeout(res, 800));
    }
    setBulkLoading(false);
    toast.success(`WhatsApp opened for ${sent_count} contacts`);
    setSelected(new Set());
  };

  return (
    <div className="p-4 md:p-6 space-y-5 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" />
            Payment Reminders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Send WhatsApp reminders for outstanding payments</p>
        </div>
        <button
          onClick={load}
          className="p-2 bg-white border border-gray-200 rounded-xl shadow-soft hover:bg-gray-50 transition-colors"
        >
          <Send className={`w-4 h-4 text-gray-500 ${loading ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Outstanding', value: `₹${fmt(metrics.total)}`,         cls: 'from-gray-800 to-gray-900',         sub: `${reminders.length} orders` },
          { label: 'Overdue (>30d)',    value: metrics.overdue.length,             cls: 'from-red-500 to-red-600',           sub: `₹${fmt(metrics.overdue.reduce((s,r)=>s+r.outstandingAmount,0))}` },
          { label: 'Due Soon (15-30d)', value: metrics.dueSoon.length,             cls: 'from-amber-500 to-amber-600',       sub: `₹${fmt(metrics.dueSoon.reduce((s,r)=>s+r.outstandingAmount,0))}` },
          { label: 'Recent (<15d)',     value: metrics.upcoming.length,            cls: 'from-blue-500 to-blue-600',         sub: `₹${fmt(metrics.upcoming.reduce((s,r)=>s+r.outstandingAmount,0))}` },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-gradient-to-br ${c.cls} rounded-2xl p-4 text-white shadow-md`}>
            <p className="text-xs font-semibold opacity-80 mb-1">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs opacity-70 mt-1">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters + bulk action */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, order…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>

        {/* Urgency filter */}
        <div className="relative">
          <select value={urgencyF} onChange={e => setUrgencyF(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-700 cursor-pointer">
            <option value="ALL">All Urgencies</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="UPCOMING">Recent</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Bulk WhatsApp */}
        {selected.size > 0 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={handleBulkSend}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-60 shadow-md"
          >
            <WhatsAppIcon className="w-4 h-4" />
            {bulkLoading ? 'Opening…' : `Send to ${selected.size}`}
          </motion.button>
        )}

        {/* Select all */}
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Users className="w-4 h-4" />
          {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
        </button>

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} records</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
            <span className="text-sm">Loading outstanding payments…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle className="w-12 h-12 opacity-20 mb-3" />
            <p className="text-sm font-medium">No outstanding payments found</p>
            <p className="text-xs mt-1">All clear!</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="w-5" />
              <div>Customer</div>
              <div className="text-right hidden sm:block">Outstanding</div>
              <div className="text-center hidden md:block">Days</div>
              <div className="text-center">WhatsApp</div>
            </div>

            <div className="divide-y divide-gray-50">
              <AnimatePresence initial={false}>
                {filtered.map((r, i) => {
                  const U = URGENCY[r.urgency];
                  const UIcon = U.icon;
                  const isSent = sent.has(r.id);
                  const isSelected = selected.has(r.id);

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3.5 transition-colors ${isSelected ? 'bg-primary-50/50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelect(r.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>

                      {/* Customer info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800 truncate">{r.party}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${U.cls}`}>
                            <UIcon className="w-3 h-3" />
                            {U.label}
                          </span>
                          {isSent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                              <WhatsAppIcon className="w-2.5 h-2.5" /> Sent
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500 font-mono">{r.referenceNo}</span>
                          {r.contactNumber && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {r.contactNumber}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{fmtDate(r.date)}</span>
                        </div>
                        {/* Mobile amount row */}
                        <div className="flex items-center gap-3 mt-1 sm:hidden">
                          <span className="text-sm font-bold text-red-600">₹{fmt(r.outstandingAmount)}</span>
                          <span className="text-xs text-gray-400">{r.daysPending}d pending</span>
                        </div>
                      </div>

                      {/* Outstanding */}
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-red-600">₹{fmt(r.outstandingAmount)}</p>
                        <p className="text-xs text-gray-400">of ₹{fmt(r.totalAmount)}</p>
                      </div>

                      {/* Days */}
                      <div className="text-center hidden md:flex items-center justify-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                          r.urgency === 'OVERDUE' ? 'bg-red-50 text-red-600' :
                          r.urgency === 'DUE_SOON' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {r.daysPending}d
                        </span>
                      </div>

                      {/* WhatsApp button */}
                      <div className="flex items-center justify-center">
                        <motion.button
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setModal(r)}
                          title={r.contactNumber ? `Send WhatsApp to ${r.party}` : 'No phone number'}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                            r.contactNumber
                              ? 'bg-[#25D366] hover:bg-[#22c55e] text-white'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">{isSent ? 'Resend' : 'Send'}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Message preview modal */}
      <AnimatePresence>
        {modal && (
          <MessageModal
            reminder={modal}
            companyName={companyName}
            onClose={() => setModal(null)}
            onSend={(msg) => handleSend(modal, msg)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
