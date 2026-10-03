import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { cashewFlowXCustomerService } from '../../services/cashewFlowXService';
import { notifyCashewFlowXError } from './cashewFlowXFormat';

const EMPTY_FORM = { customerName: '', mobileNumber: '', address: '', notes: '', status: 'Active' };

const validateCustomer = (form) => {
  const errors = {};
  if (!form.customerName.trim()) errors.customerName = 'Customer name is required';
  if (form.mobileNumber && !/^[0-9]{10}$/.test(form.mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number must be exactly 10 digits';
  }
  return errors;
};

// Create / edit modal for CashewFlowXCustomer. Pass `customer` to edit.
const CashewFlowXCustomerForm = ({ isOpen, customer, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(customer?.id);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setForm(customer ? {
      customerName: customer.customerName || '',
      mobileNumber: customer.mobileNumber || '',
      address: customer.address || '',
      notes: customer.notes || '',
      status: customer.status || 'Active',
    } : EMPTY_FORM);
  }, [isOpen, customer]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateCustomer(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const payload = { ...form, customerName: form.customerName.trim(), mobileNumber: form.mobileNumber.trim() };
      const saved = isEdit
        ? await cashewFlowXCustomerService.update(customer.id, payload)
        : await cashewFlowXCustomerService.create(payload);
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      onSaved?.(saved);
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            className={`input-field ${errors.customerName ? 'input-error' : ''}`}
            value={form.customerName}
            onChange={(e) => setField('customerName', e.target.value)}
            placeholder="e.g. ABC Traders"
            autoFocus
          />
          {errors.customerName && <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            className={`input-field ${errors.mobileNumber ? 'input-error' : ''}`}
            value={form.mobileNumber}
            onChange={(e) => setField('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            inputMode="numeric"
          />
          {errors.mobileNumber && <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input className="input-field" value={form.address} onChange={(e) => setField('address', e.target.value)} maxLength={255} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="input-field" value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Save Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CashewFlowXCustomerForm;
