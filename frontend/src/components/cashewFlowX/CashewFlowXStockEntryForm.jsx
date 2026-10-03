import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cashewFlowXStockEntryService } from '../../services/cashewFlowXService';
import CashewFlowXCashewTypeSelect from './CashewFlowXCashewTypeSelect';
import CashewFlowXCustomerSelect from './CashewFlowXCustomerSelect';
import {
  calculateCashewFlowXTotal,
  cashewFlowXToday,
  formatCashewFlowXCurrency,
  notifyCashewFlowXError,
} from './cashewFlowXFormat';

const emptyStockForm = (customerId) => ({
  customerId: customerId ? String(customerId) : '',
  cashewTypeId: '',
  quantityKg: '',
  pricePerKg: '',
  givenDate: cashewFlowXToday(),
  notes: '',
});

const validateStock = (form) => {
  const errors = {};
  if (!form.customerId) errors.customerId = 'Customer is required';
  if (!form.cashewTypeId) errors.cashewTypeId = 'Cashew type is required';
  const qty = parseFloat(form.quantityKg);
  if (!Number.isFinite(qty) || qty <= 0) errors.quantityKg = 'Quantity must be greater than 0';
  const price = parseFloat(form.pricePerKg);
  if (form.pricePerKg === '' || !Number.isFinite(price) || price < 0) errors.pricePerKg = 'Price per KG must be 0 or greater';
  if (!form.givenDate) errors.givenDate = 'Given date is required';
  return errors;
};

/**
 * Add / edit a CashewFlowXStockEntry.
 * - `customerId`: fixes the customer (customer view). Omit to show a customer picker.
 * - `entry`: an existing entry to edit (its customer cannot change).
 * Total Amount is display-only here; the server recalculates and stores it.
 */
const CashewFlowXStockEntryForm = ({ customerId, entry, onSaved, onCancel }) => {
  const [form, setForm] = useState(() => emptyStockForm(customerId));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(entry?.id);

  useEffect(() => {
    setErrors({});
    setForm(entry ? {
      customerId: String(entry.customerId),
      cashewTypeId: String(entry.cashewTypeId),
      quantityKg: String(entry.quantityKg),
      pricePerKg: String(entry.pricePerKg),
      givenDate: entry.givenDate,
      notes: entry.notes || '',
    } : emptyStockForm(customerId));
  }, [entry, customerId]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const totalAmount = calculateCashewFlowXTotal(form.quantityKg, form.pricePerKg);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateStock(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      cashewTypeId: Number(form.cashewTypeId),
      quantityKg: parseFloat(form.quantityKg),
      pricePerKg: parseFloat(form.pricePerKg),
      givenDate: form.givenDate,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      const saved = isEdit
        ? await cashewFlowXStockEntryService.update(entry.id, payload)
        : await cashewFlowXStockEntryService.create({ ...payload, customerId: Number(form.customerId) });
      toast.success(isEdit ? 'Stock entry updated' : 'Stock entry saved');
      onSaved?.(saved);
      if (!isEdit) setForm((f) => ({ ...emptyStockForm(customerId || f.customerId) }));
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to save stock entry');
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cashew Type *</label>
        <CashewFlowXCashewTypeSelect value={form.cashewTypeId} onChange={(v) => setField('cashewTypeId', v)} error={errors.cashewTypeId} />
        {fieldError('cashewTypeId')}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (KG) *</label>
          <input
            type="number" min="0" step="0.001" inputMode="decimal"
            className={`input-field ${errors.quantityKg ? 'input-error' : ''}`}
            value={form.quantityKg}
            onChange={(e) => setField('quantityKg', e.target.value)}
            placeholder="e.g. 100"
          />
          {fieldError('quantityKg')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Per KG (₹) *</label>
          <input
            type="number" min="0" step="0.01" inputMode="decimal"
            className={`input-field ${errors.pricePerKg ? 'input-error' : ''}`}
            value={form.pricePerKg}
            onChange={(e) => setField('pricePerKg', e.target.value)}
            placeholder="e.g. 800"
          />
          {fieldError('pricePerKg')}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Given Date *</label>
        <input
          type="date"
          className={`input-field ${errors.givenDate ? 'input-error' : ''}`}
          value={form.givenDate}
          onChange={(e) => setField('givenDate', e.target.value)}
        />
        {fieldError('givenDate')}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3">
        <span className="text-sm font-medium text-green-900">Total Amount (auto)</span>
        <span className="text-xl font-bold text-green-700">{formatCashewFlowXCurrency(totalAmount)}</span>
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
          {saving ? 'Saving...' : isEdit ? 'Update Stock' : 'Save Stock'}
        </button>
      </div>
    </form>
  );
};

export default CashewFlowXStockEntryForm;
