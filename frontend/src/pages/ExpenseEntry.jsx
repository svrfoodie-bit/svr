import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { expenseService, EXPENSE_CATEGORIES, PAYMENT_MODES } from '../services/expenseService';
import { showFallbackError } from '../utils/errorHandling';

const ExpenseEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Electricity',
    description: '',
    amount: '',
    paymentMode: 'Cash',
    transactionId: '', // For PhonePe/Bank
    bankName: '', // For Bank Transfer
    accountNumber: '', // For Bank Transfer
    paidTo: '',
    remarks: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadExpenseData();
    }
  }, [id]);

  const loadExpenseData = async () => {
    try {
      const expense = await expenseService.getById(id);
      if (expense) {
        setFormData({
          date: expense.date,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          paymentMode: expense.paymentMode,
          transactionId: expense.transactionId || '',
          bankName: expense.bankName || '',
          accountNumber: expense.accountNumber || '',
          paidTo: expense.paidTo,
          remarks: expense.remarks || '',
        });
      } else {
        toast.error('Expense not found');
        navigate('/expenses');
      }
    } catch (error) {
      toast.error('Failed to load expense data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (amount <= 0) {
        toast.error('Amount must be greater than zero');
        setLoading(false);
        return;
      }

      // Validate future date
      const expenseDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (expenseDate > today) {
        toast.error('Cannot create expense with future date');
        setLoading(false);
        return;
      }

      // Validate remarks for edit mode
      if (isEditMode && (!formData.remarks || formData.remarks.trim() === '')) {
        toast.error('Remarks are required when editing an expense');
        setLoading(false);
        return;
      }

      if (isEditMode) {
        await expenseService.update(id, formData);
        toast.success('Expense updated successfully');
      } else {
        await expenseService.create(formData);
        toast.success('Expense created successfully');
      }

      navigate('/expenses');
    } catch (error) {
      showFallbackError(error, isEditMode ? 'Failed to update expense' : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  useKeyboardSave(handleSubmit);
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Expense' : 'New Expense'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update expense details' : 'Record a new business expense'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Future dates are not allowed</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([type, categories]) => (
                  <optgroup key={type} label={type}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Amount must be greater than zero</p>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                {PAYMENT_MODES.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* PhonePe/Bank Transaction ID */}
            {(formData.paymentMode === 'PhonePe' || formData.paymentMode === 'Bank') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.paymentMode === 'PhonePe' ? 'Transaction ID / UPI Ref No' : 'Transaction ID / Reference No'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder={formData.paymentMode === 'PhonePe' ? 'Enter UPI Transaction ID' : 'Enter Bank Reference No'}
                  required
                />
              </div>
            )}

            {/* Bank Details */}
            {formData.paymentMode === 'Bank' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    placeholder="Enter Bank Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number (Last 4 digits)
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    maxLength="4"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    placeholder="Last 4 digits"
                  />
                </div>
              </>
            )}

            {/* Paid To */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Paid To <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="paidTo"
                value={formData.paidTo}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="Vendor or recipient name"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                placeholder="Detailed description of the expense..."
                required
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remarks {isEditMode && <span className="text-red-500">*</span>}
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                placeholder={isEditMode ? "Required: Reason for updating this expense..." : "Optional notes..."}
                required={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-orange-600 mt-1">Remarks are required when editing expenses (owner approval)</p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Important:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Expense number will be auto-generated (EXP-2024-001, etc.)</li>
                  <li>• Amount must be greater than zero</li>
                  <li>• Future dates are not allowed</li>
                  <li>• Expenses cannot be hard deleted (soft delete only)</li>
                  {isEditMode && <li>• Remarks are required for owner approval when editing</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft hover:shadow-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{isEditMode ? 'Update Expense' : 'Create Expense'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/expenses')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExpenseEntry;
