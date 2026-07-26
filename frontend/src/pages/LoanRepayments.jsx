import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, X, IndianRupee, Building2, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  loanService,
  loanPaymentService,
  PAYMENT_MODES,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  formatCurrency,
  calcMonthlyInterest,
} from '../services/loanService';

const emptyForm = {
  loanId: '',
  paymentDate: new Date().toISOString().split('T')[0],
  principalAmount: '',
  interestAmount: '',
  paymentMode: 'Cash',
  paymentType: 'EMI',
  notes: '',
};

const LoanRepayments = () => {
  const [searchParams] = useSearchParams();
  const preselectedLoanId = searchParams.get('loanId');

  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm, loanId: preselectedLoanId || '' });
  const [saving, setSaving] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    if (formData.loanId) {
      const loan = loans.find((l) => String(l.id) === String(formData.loanId));
      setSelectedLoan(loan || null);
      loadPayments(formData.loanId);
    } else {
      setSelectedLoan(null);
      setPayments([]);
    }
  }, [formData.loanId, loans]);

  // Auto-fill interest when loan selected and principal entered
  useEffect(() => {
    if (selectedLoan && formData.paymentType !== 'PrincipalOnly' && formData.paymentType !== 'Prepayment') {
      const outstanding = parseFloat(selectedLoan.outstandingBalance) || parseFloat(selectedLoan.principalAmount);
      const monthly = calcMonthlyInterest(outstanding, parseFloat(selectedLoan.interestRate));
      setFormData((p) => ({ ...p, interestAmount: monthly.toFixed(2) }));
    }
  }, [selectedLoan, formData.paymentType]);

  const loadLoans = async () => {
    try {
      const data = await loanService.getAll({ status: 'Active' });
      setLoans(data);
      if (preselectedLoanId) {
        const loan = data.find((l) => String(l.id) === String(preselectedLoanId));
        setSelectedLoan(loan || null);
        loadPayments(preselectedLoanId);
      }
    } catch {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (loanId) => {
    try {
      const data = await loanPaymentService.getByLoan(loanId);
      setPayments(data);
    } catch {
      toast.error('Failed to load payments');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handlePaymentTypeChange = (type) => {
    setFormData((p) => ({
      ...p,
      paymentType: type,
      principalAmount: type === 'InterestOnly' ? '0' : p.principalAmount,
      interestAmount: type === 'PrincipalOnly' ? '0' : p.interestAmount,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.loanId) { toast.error('Select a loan'); return; }
    const total = (parseFloat(formData.principalAmount) || 0) + (parseFloat(formData.interestAmount) || 0);
    if (total <= 0) { toast.error('Payment amount must be greater than zero'); return; }

    setSaving(true);
    try {
      await loanPaymentService.create(formData);
      toast.success('Payment recorded');
      setShowForm(false);
      setFormData({ ...emptyForm, loanId: formData.loanId });
      await loadLoans();
      loadPayments(formData.loanId);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await loanPaymentService.delete(id);
      toast.success('Payment deleted');
      loadPayments(formData.loanId);
      loadLoans();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.principalAmount) + parseFloat(p.interestAmount), 0);
  const totalInterestPaid = payments.reduce((s, p) => s + parseFloat(p.interestAmount), 0);
  const totalPrincipalPaid = payments.reduce((s, p) => s + parseFloat(p.principalAmount), 0);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Loan Repayments</h1>
          <p className="text-sm text-gray-600 mt-1">Record EMI, interest, and principal payments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all text-sm"
        >
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Loan Selector */}
      <div className="mb-5">
        <select
          value={formData.loanId}
          onChange={(e) => setFormData((p) => ({ ...p, loanId: e.target.value }))}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[280px]"
        >
          <option value="">Select a loan to view payments</option>
          {loans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.loanCode} — {l.lenderName} ({l.loanType}) · Outstanding: {formatCurrency(l.outstandingBalance)}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Loan Summary */}
      {selectedLoan && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 mb-5"
        >
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Lender</p>
              <div className="flex items-center gap-2 mt-1">
                {selectedLoan.loanType === 'Bank' ? <Building2 size={14} className="text-blue-500" /> : <Users size={14} className="text-orange-500" />}
                <p className="font-bold text-gray-800">{selectedLoan.lenderName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Principal</p>
              <p className="font-bold text-gray-800 mt-1">{formatCurrency(selectedLoan.principalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</p>
              <p className="font-bold text-red-600 mt-1">{formatCurrency(selectedLoan.outstandingBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Rate</p>
              <p className="font-bold text-gray-800 mt-1">{selectedLoan.interestRate}% p.a.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Interest</p>
              <p className="font-bold text-orange-600 mt-1">
                {formatCurrency(calcMonthlyInterest(parseFloat(selectedLoan.outstandingBalance) || 0, parseFloat(selectedLoan.interestRate)))}
              </p>
            </div>
            {payments.length > 0 && (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Paid</p>
                  <p className="font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Principal Paid</p>
                  <p className="font-bold text-gray-700 mt-1">{formatCurrency(totalPrincipalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Interest Paid</p>
                  <p className="font-bold text-gray-700 mt-1">{formatCurrency(totalInterestPaid)}</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Payment Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6"
        >
          <h2 className="text-base font-bold text-gray-900 mb-5">Record Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loan <span className="text-red-500">*</span></label>
                <select
                  name="loanId"
                  value={formData.loanId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                >
                  <option value="">Select loan</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>{l.loanCode} — {l.lenderName}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Payment Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Type <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handlePaymentTypeChange(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        formData.paymentType === t
                          ? t === 'FullSettlement' ? 'border-green-500 bg-green-50 text-green-700' : 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {PAYMENT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Principal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Principal Amount (₹)</label>
                <input
                  type="number"
                  name="principalAmount"
                  value={formData.principalAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  disabled={formData.paymentType === 'InterestOnly'}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all disabled:opacity-50"
                  placeholder="0"
                />
              </div>

              {/* Interest */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Amount (₹)</label>
                <input
                  type="number"
                  name="interestAmount"
                  value={formData.interestAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  disabled={formData.paymentType === 'PrincipalOnly'}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all disabled:opacity-50"
                  placeholder="0"
                />
                {selectedLoan && (
                  <p className="text-xs text-blue-600 mt-1">
                    Suggested: {formatCurrency(calcMonthlyInterest(parseFloat(selectedLoan.outstandingBalance) || 0, parseFloat(selectedLoan.interestRate)))}
                  </p>
                )}
              </div>

              {/* Total */}
              {(formData.principalAmount || formData.interestAmount) && (
                <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700">Total Payment</span>
                  <span className="text-base font-bold text-green-700">
                    {formatCurrency((parseFloat(formData.principalAmount) || 0) + (parseFloat(formData.interestAmount) || 0))}
                  </span>
                </div>
              )}

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode <span className="text-red-500">*</span></label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                >
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            {formData.paymentType === 'FullSettlement' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 font-medium">
                Full Settlement will mark this loan as Closed.
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                Save Payment
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData({ ...emptyForm, loanId: formData.loanId }); }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2 text-sm"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Payments Table */}
      {!loading && formData.loanId && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Payment History</h2>
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <IndianRupee size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Date', 'Type', 'Principal', 'Interest', 'Total', 'Mode', 'Notes', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.paymentType === 'FullSettlement' ? 'bg-green-100 text-green-700' :
                          p.paymentType === 'InterestOnly' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {PAYMENT_TYPE_LABELS[p.paymentType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(p.principalAmount)}</td>
                      <td className="px-4 py-3 text-orange-600">{formatCurrency(p.interestAmount)}</td>
                      <td className="px-4 py-3 font-bold">{formatCurrency(parseFloat(p.principalAmount) + parseFloat(p.interestAmount))}</td>
                      <td className="px-4 py-3 text-gray-600">{p.paymentMode}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanRepayments;
