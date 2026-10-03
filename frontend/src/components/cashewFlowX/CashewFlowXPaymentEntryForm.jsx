import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cashewFlowXPaymentEntryService } from '../../services/cashewFlowXService';
import CashewFlowXCustomerSelect from './CashewFlowXCustomerSelect';
import { cashewFlowXToday, formatCashewFlowXCurrency, notifyCashewFlowXError } from './cashewFlowXFormat';

const emptyPaymentForm = (customerId) => ({
  customerId: customerId ? String(customerId) : '',
  paymentAmount: '',
  paymentDate: cashewFlowXToday(),
  paymentMode: '',
  referenceNumber: '',
  notes: '',
});

const validatePayment = (form) => {
  const errors = {};
  if (!form.customerId) errors.customerId = 'Customer is required';
  const amount = parseFloat(form.paymentAmount);
  if (!Number.isFinite(amount) || amount <= 0) errors.paymentAmount = 'Payment amount must be greater than 0';
  if (!form.paymentDate) errors.paymentDate = 'Payment date is required';
  if (!form.paymentMode) errors.paymentMode = 'Payment mode is required';
  return errors;
};

/**
 * Add / edit a CashewFlowXPaymentEntry. A payment belongs to the customer,
 * not to a stock entry. Overpayment is allowed and shows up as Advance.
 * - `outstandingBalance`: optional hint shown above the amount field.
 */
const CashewFlowXPaymentEntryForm = ({ customerId, entry, outstandingBalance, onSaved, onCancel }) => {
  const [form, setForm] = useState(() => emptyPaymentForm(customerId));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [paymentModes, setPaymentModes] = useState([]);
  const isEdit = Boolean(entry?.id);

  useEffect(() => {
    cashewFlowXPaymentEntryService.getPaymentModes()
      .then((modes) => setPaymentModes(modes || []))
      .catch((err) => notifyCashewFlowXError(err, 'Failed to load payment modes'));
  }, []);

  useEffect(() => {
    setErrors({});
    setForm(entry ? {
      customerId: String(entry.customerId),
      paymentAmount: String(entry.paymentAmount),
      paymentDate: entry.paymentDate,
      paymentMode: entry.paymentMode,
      referenceNumber: entry.referenceNumber || '',
      notes: entry.notes || '',
    } : emptyPaymentForm(customerId));
  }, [entry, customerId]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validatePayment(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      paymentAmount: parseFloat(form.paymentAmount),
      paymentDate: form.paymentDate,
      paymentMode: form.paymentMode,
      referenceNumber: form.referenceNumber.trim() || null,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      const saved = isEdit
        ? await cashewFlowXPaymentEntryService.update(entry.id, payload)
        : await cashewFlowXPaymentEntryService.create({ ...payload, customerId: Number(form.customerId) });
      toast.success(isEdit ? 'Payment updated' : 'Payment saved');
      onSaved?.(saved);
      if (!isEdit) setForm((f) => ({ ...emptyPaymentForm(customerId || f.customerId) }));
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field) => errors[field] && <p className="text-xs text-red-600 mt-1">{errors[field]}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!customerId && !isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <CashewFlowXCustomerSelect value={form.customerId} onChange={(v) => setField('customerId', v)} error={errors.customerId} />
          {fieldError('customerId')}
        </div>
      )}
      {!isEdit && outstandingBalance > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm">
          <span className="text-red-800">Current outstanding</span>
          <button type="button" className="font-semibold text-red-700 underline" onClick={() => setField('paymentAmount', String(outstandingBalance))}>
            {formatCashewFlowXCurrency(outstandingBalance)} (use full amount)
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹) *</label>
          <input
            type="number" min="0" step="0.01" inputMode="decimal"
            className={`input-field ${errors.paymentAmount ? 'input-error' : ''}`}
            value={form.paymentAmount}
            onChange={(e) => setField('paymentAmount', e.target.value)}
            placeholder="e.g. 30000"
          />
          {fieldError('paymentAmount')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
          <input
            type="date"
            className={`input-field ${errors.paymentDate ? 'input-error' : ''}`}
            value={form.paymentDate}
            onChange={(e) => setField('paymentDate', e.target.value)}
          />
          {fieldError('paymentDate')}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
          <select
            className={`input-field ${errors.paymentMode ? 'input-error' : ''}`}
            value={form.paymentMode}
            onChange={(e) => setField('paymentMode', e.target.value)}
          >
            <option value="">Select mode</option>
            {paymentModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
          {fieldError('paymentMode')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Txn No.</label>
          <input
            className="input-field"
            value={form.referenceNumber}
            onChange={(e) => setField('referenceNumber', e.target.value)}
            maxLength={100}
            placeholder="Optional"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : isEdit ? 'Update Payment' : 'Save Payment'}
        </button>
      </div>
    </form>
  );
};

export default CashewFlowXPaymentEntryForm;
