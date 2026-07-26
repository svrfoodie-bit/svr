import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  loanService,
  LOAN_TYPES,
  INTEREST_PAYMENT_TYPES,
  REPAYMENT_TYPES,
  LOAN_PURPOSES,
  calcMonthlyInterest,
  formatCurrency,
} from '../services/loanService';

const LoanEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    loanType: 'Bank',
    lenderName: '',
    lenderPhone: '',
    principalAmount: '',
    interestRate: '',
    interestPaymentType: 'Monthly',
    repaymentType: 'EMI',
    tenureMonths: '',
    startDate: new Date().toISOString().split('T')[0],
    purpose: '',
    bankAccountNo: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode) loadLoan();
  }, [id]);

  // Auto-set repaymentType based on loanType
  useEffect(() => {
    if (formData.loanType === 'Bank') {
      setFormData((p) => ({ ...p, repaymentType: 'EMI', interestPaymentType: 'Monthly' }));
    } else {
      setFormData((p) => ({ ...p, repaymentType: 'Custom' }));
    }
  }, [formData.loanType]);

  const loadLoan = async () => {
    try {
      const loan = await loanService.getById(id);
      setFormData({
        loanType: loan.loanType,
        lenderName: loan.lenderName,
        lenderPhone: loan.lenderPhone || '',
        principalAmount: loan.principalAmount,
        interestRate: loan.interestRate,
        interestPaymentType: loan.interestPaymentType,
        repaymentType: loan.repaymentType,
        tenureMonths: loan.tenureMonths || '',
        startDate: loan.startDate?.split('T')[0] || loan.startDate,
        purpose: loan.purpose || '',
        bankAccountNo: loan.bankAccountNo || '',
        notes: loan.notes || '',
      });
    } catch {
      toast.error('Failed to load loan');
      navigate('/loans');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
      toast.error('Principal amount must be greater than zero');
      return;
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
      toast.error('Interest rate must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await loanService.update(id, formData);
        toast.success('Loan updated successfully');
      } else {
        await loanService.create(formData);
        toast.success('Loan added successfully');
      }
      navigate('/loans');
    } catch (err) {
      toast.error(err.message || 'Failed to save loan');
    } finally {
      setLoading(false);
    }
  };

  const previewMonthlyInterest =
    formData.principalAmount && formData.interestRate
      ? calcMonthlyInterest(parseFloat(formData.principalAmount), parseFloat(formData.interestRate))
      : null;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Loan' : 'Add Loan'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update loan details' : 'Record a new bank or hand loan'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">

          {/* Loan Type */}
          <div className="grid grid-cols-2 gap-3">
            {LOAN_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, loanType: type }))}
                className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  formData.loanType === type
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type === 'Bank' ? '🏦 Bank Loan' : '🤝 Hand Loan'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Lender Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.loanType === 'Bank' ? 'Bank Name' : 'Lender Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lenderName"
                value={formData.lenderName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder={formData.loanType === 'Bank' ? 'e.g. SBI, HDFC' : 'Person name'}
                required
              />
            </div>

            {/* Phone (hand loans) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.loanType === 'Bank' ? 'Account / Loan No' : 'Lender Phone'}
              </label>
              <input
                type="text"
                name={formData.loanType === 'Bank' ? 'bankAccountNo' : 'lenderPhone'}
                value={formData.loanType === 'Bank' ? formData.bankAccountNo : formData.lenderPhone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder={formData.loanType === 'Bank' ? 'Loan account number' : '10-digit mobile'}
              />
            </div>

            {/* Principal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Principal Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="principalAmount"
                value={formData.principalAmount}
                onChange={handleChange}
                min="1"
                step="1"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0"
                required
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-orange-600 mt-1">Principal cannot be changed after creation</p>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interest Rate (% per annum) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                max="100"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="e.g. 12"
                required
              />
              {previewMonthlyInterest && (
                <p className="text-xs text-blue-600 mt-1">
                  Monthly interest ≈ {formatCurrency(previewMonthlyInterest)}
                </p>
              )}
            </div>

            {/* Interest Payment Type (Hand loan only) */}
            {formData.loanType === 'Hand' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Interest Payment <span className="text-red-500">*</span>
                </label>
                <select
                  name="interestPaymentType"
                  value={formData.interestPaymentType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                >
                  <option value="Monthly">Monthly (pay interest each month)</option>
                  <option value="EndOfTerm">End of Term (pay all at once)</option>
                </select>
              </div>
            )}

            {/* Tenure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tenure (Months)
              </label>
              <input
                type="number"
                name="tenureMonths"
                value={formData.tenureMonths}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="e.g. 24"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              >
                <option value="">Select purpose</option>
                {LOAN_PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                placeholder="Any additional details about this loan..."
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Note:</p>
                <ul className="space-y-0.5">
                  <li>• Loan code will be auto-generated</li>
                  <li>• Principal amount cannot be changed after creation</li>
                  {formData.loanType === 'Hand' && formData.interestPaymentType === 'EndOfTerm' && (
                    <li>• End of Term: full interest will accrue and paid together at settlement</li>
                  )}
                  {formData.loanType === 'Bank' && (
                    <li>• Bank loans default to EMI repayment (Monthly interest)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
              ) : (
                <><Save size={18} /><span>{isEditMode ? 'Update Loan' : 'Add Loan'}</span></>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/loans')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoanEntry;
