import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Plus, History, Edit, Trash2, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { supplierService } from '../services/supplierService';
import useUnsavedChanges from '../hooks/useUnsavedChanges';
import { loanService } from '../services/loanService';
import { showFallbackError } from '../utils/errorHandling';

const RawPurchaseEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { markDirty, markClean, safeNavigate, ConfirmDialog } = useUnsavedChanges();

  const [suppliers, setSuppliers] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingPayments, setExistingPayments] = useState([]);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editPaymentData, setEditPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    paidAmount: '',
    transactionId: '',
    remarks: '',
  });

  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    rawQuality: 'Premium',
    quantityKg: '',
    pricePerKg: '',
    fundedByLoanId: '',
    fundedByLoanCode: '',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    paymentMode: 'Cash',
    paidAmount: '',
    transactionId: '', // For PhonePe/Bank
    bankName: '', // For Bank Transfer
    accountNumber: '', // For Bank Transfer
    remarks: '', // For any payment notes
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    location: '',
  });

  useEffect(() => {
    loadSuppliers();
    loadActiveLoans();
    if (isEditMode) {
      loadPurchaseData();
    }
  }, [id]);

  const loadActiveLoans = async () => {
    try {
      const data = await loanService.getAll({ status: 'Active' });
      setActiveLoans(data);
    } catch {
      // non-critical — silently ignore
    }
  };

  const loadPurchaseData = async () => {
    try {
      const purchase = await rawPurchaseService.getById(id);
      if (purchase) {
        setFormData({
          purchaseDate: purchase.purchaseDate,
          supplierId: purchase.supplierId.toString(),
          supplierName: purchase.supplierName,
          rawQuality: purchase.rawQuality,
          quantityKg: purchase.quantityKg,
          pricePerKg: purchase.pricePerKg,
          fundedByLoanId: purchase.fundedByLoanId || '',
          fundedByLoanCode: purchase.fundedByLoanCode || '',
          notes: purchase.notes || '',
        });
        setExistingPayments(purchase.payments || []);
      } else {
        toast.error('Purchase not found');
        navigate('/raw-purchases');
      }
    } catch (error) {
      toast.error('Failed to load purchase data');
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      toast.error('Failed to load suppliers');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    markDirty();

    // Update supplier name when supplier is selected
    if (name === 'supplierId') {
      const supplier = suppliers.find(s => s.id === parseInt(value));
      if (supplier) {
        setFormData(prev => ({ ...prev, supplierName: supplier.name }));
      }
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    markDirty();
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const supplierPayload = {
        name: newSupplier.name,
        contactPerson: newSupplier.contact,
        phone: newSupplier.contact,
        area: newSupplier.location,
        address: newSupplier.location,
      };

      const supplier = await supplierService.create(supplierPayload);
      setSuppliers(prev => [...prev, supplier]);
      setFormData(prev => ({ ...prev, supplierId: supplier.id, supplierName: supplier.name }));
      setNewSupplier({ name: '', contact: '', location: '' });
      setShowAddSupplier(false);
      toast.success('Supplier added successfully');
    } catch (error) {
      toast.error('Failed to add supplier');
    }
  };

  const resetPaymentEditor = () => {
    setEditingPaymentId(null);
    setEditPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      paidAmount: '',
      transactionId: '',
      remarks: '',
    });
  };

  const startEditPayment = (payment) => {
    setEditingPaymentId(payment.id);
    setEditPaymentData({
      paymentDate: String(payment.paymentDate || '').split('T')[0],
      paymentMode: payment.paymentMode || 'Cash',
      paidAmount: payment.paidAmount ?? payment.amount ?? '',
      transactionId: payment.transactionId || payment.reference || '',
      remarks: payment.remarks || payment.notes || '',
    });
  };

  const handleUpdatePayment = async (paymentId) => {
    try {
      await rawPurchaseService.updatePayment(paymentId, {
        paymentDate: editPaymentData.paymentDate,
        paymentMode: editPaymentData.paymentMode,
        paidAmount: parseFloat(editPaymentData.paidAmount),
        transactionId: editPaymentData.transactionId,
        remarks: editPaymentData.remarks,
      });
      toast.success('Payment updated successfully');
      resetPaymentEditor();
      loadPurchaseData();
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment entry?')) return;
    try {
      await rawPurchaseService.deletePayment(paymentId);
      toast.success('Payment deleted successfully');
      loadPurchaseData();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.supplierId) {
        toast.error('Please select a supplier');
        setLoading(false);
        return;
      }

      const selectedLoan = activeLoans.find(l => String(l.id) === String(formData.fundedByLoanId));
      const purchase = {
        supplierId: parseInt(formData.supplierId),
        purchaseDate: formData.purchaseDate,
        rawQuality: formData.rawQuality,
        quantityKg: parseFloat(formData.quantityKg),
        pricePerKg: parseFloat(formData.pricePerKg),
        quantity: parseFloat(formData.quantityKg),
        ratePerUnit: parseFloat(formData.pricePerKg),
        totalAmount: parseFloat(totalAmount),
        grade: formData.rawQuality,
        fundedByLoanId: formData.fundedByLoanId ? parseInt(formData.fundedByLoanId) : null,
        fundedByLoanCode: selectedLoan ? selectedLoan.loanCode : null,
        notes: formData.notes || null,
      };

      if (isEditMode) {
        // Update existing purchase
        await rawPurchaseService.update(id, purchase);

        // Add new payment if provided
        if (paymentData.paidAmount) {
          const paidAmount = parseFloat(paymentData.paidAmount);
          if (paidAmount > remainingBeforeNewPayment) {
            toast.error('Payment amount cannot be more than the remaining balance');
            setLoading(false);
            return;
          }

          const payment = {
            paymentMode: paymentData.paymentMode,
            paidAmount,
            paymentDate: formData.purchaseDate,
            transactionId: paymentData.transactionId,
            remarks: paymentData.remarks,
          };
          await rawPurchaseService.addPayment(id, payment);
        }

        toast.success('Purchase updated successfully');
      } else {
        // Create new purchase
        const payment = paymentData.paidAmount
          ? {
              paymentMode: paymentData.paymentMode,
              paidAmount: parseFloat(paymentData.paidAmount),
              paymentDate: formData.purchaseDate,
              transactionId: paymentData.transactionId,
              remarks: paymentData.remarks,
            }
          : null;

        await rawPurchaseService.create(purchase, payment);

        toast.success('Purchase recorded successfully');
      }

      markClean();
      navigate('/raw-purchases');
    } catch (error) {
      showFallbackError(error, isEditMode ? 'Failed to update purchase' : 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (formData.quantityKg && formData.pricePerKg)
    ? (parseFloat(formData.quantityKg) * parseFloat(formData.pricePerKg)).toFixed(2)
    : '0.00';

  const existingPaidTotal = existingPayments.reduce((sum, payment) => {
    return sum + (parseFloat(payment.paidAmount ?? payment.amount ?? 0) || 0);
  }, 0);
  const remainingBeforeNewPayment = Math.max(0, parseFloat(totalAmount || 0) - existingPaidTotal);
  const balance = Math.max(0, remainingBeforeNewPayment - (parseFloat(paymentData.paidAmount) || 0));

  useKeyboardSave(handleSubmit);
  return (
    <div className="p-4 md:p-6">
      <ConfirmDialog />
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Raw Purchase' : 'New Raw Purchase'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update raw cashew purchase details' : 'Record raw cashew purchase details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">
          {/* Purchase Date & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(!showAddSupplier)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add New
                </button>
              </div>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Supplier Form */}
          {showAddSupplier && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary-50 rounded-xl p-4 border border-primary-200"
            >
              <h3 className="font-semibold text-gray-900 mb-3">Add New Supplier</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  required
                />
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contact: e.target.value }))}
                  className="px-3 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newSupplier.location}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, location: e.target.value }))}
                  className="px-3 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Save Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Quality, Quantity, Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Raw Quality <span className="text-red-500">*</span>
              </label>
              <select
                name="rawQuality"
                value={formData.rawQuality}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                <option value="Premium">Premium</option>
                <option value="Mid">Mid</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity (KG) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantityKg"
                value={formData.quantityKg}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price per KG (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="pricePerKg"
                value={formData.pricePerKg}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Total Amount Display */}
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <span className="text-2xl font-bold text-primary-600">₹{parseFloat(totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Funded By Loan (Optional) */}
          {activeLoans.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Funded By Loan
                <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <select
                name="fundedByLoanId"
                value={formData.fundedByLoanId}
                onChange={(e) => {
                  const loan = activeLoans.find(l => String(l.id) === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    fundedByLoanId: e.target.value,
                    fundedByLoanCode: loan ? loan.loanCode : '',
                  }));
                  markDirty();
                }}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              >
                <option value="">Not funded by loan / Own funds</option>
                {activeLoans.map(loan => (
                  <option key={loan.id} value={loan.id}>
                    {loan.loanCode} — {loan.lenderName} ({loan.loanType}) · ₹{parseFloat(loan.principalAmount).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              {formData.fundedByLoanId && (
                <p className="text-xs text-blue-600 mt-1">
                  This purchase will be linked to loan {formData.fundedByLoanCode} for tracking purposes.
                </p>
              )}
            </div>
          )}

          {/* Existing Payment History (Edit Mode Only) */}
          {isEditMode && existingPayments.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Payment History</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="space-y-2">
                  {existingPayments.map((payment, index) => (
                    <div key={payment.id} className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{payment.paidAmount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.paymentDate).toLocaleDateString('en-IN')} • {payment.paymentMode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditPayment(payment)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit payment"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete payment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {editingPaymentId === payment.id && (
                        <div className="mt-3 space-y-3 rounded-xl border border-primary-100 bg-primary-50/40 p-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="date"
                              value={editPaymentData.paymentDate}
                              onChange={(e) => setEditPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm"
                            />
                            <select
                              value={editPaymentData.paymentMode}
                              onChange={(e) => setEditPaymentData(prev => ({ ...prev, paymentMode: e.target.value }))}
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm"
                            >
                              <option value="Cash">Cash</option>
                              <option value="PhonePe">PhonePe</option>
                              <option value="Bank">Bank Transfer</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                            <input
                              type="number"
                              value={editPaymentData.paidAmount}
                              onChange={(e) => setEditPaymentData(prev => ({ ...prev, paidAmount: e.target.value }))}
                              step="0.01"
                              min="0"
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm"
                              placeholder="Amount"
                            />
                          </div>
                          <input
                            type="text"
                            value={editPaymentData.transactionId}
                            onChange={(e) => setEditPaymentData(prev => ({ ...prev, transactionId: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm"
                            placeholder="Transaction ID / Reference"
                          />
                          <input
                            type="text"
                            value={editPaymentData.remarks}
                            onChange={(e) => setEditPaymentData(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm"
                            placeholder="Remarks"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={resetPaymentEditor}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePayment(payment.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                              <Check size={13} />
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Additional Payment Details */}
                      {(payment.transactionId || payment.bankName) && (
                        <div className="mt-2 pl-11 space-y-1">
                          {payment.transactionId && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Transaction ID:</span> {payment.transactionId}
                            </p>
                          )}
                          {payment.bankName && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Bank:</span> {payment.bankName}
                              {payment.accountNumber && ` (****${payment.accountNumber})`}
                            </p>
                          )}
                          {payment.remarks && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Remarks:</span> {payment.remarks}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Paid:</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{existingPayments.reduce((sum, p) => sum + p.paidAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {isEditMode ? 'Add New Payment (Optional)' : 'Payment Details (Optional)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Mode
                </label>
                <select
                  name="paymentMode"
                  value={paymentData.paymentMode}
                  onChange={handlePaymentChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                >
                  <option value="Cash">Cash</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paid Amount (₹)
                </label>
                <input
                  type="number"
                  name="paidAmount"
                  value={paymentData.paidAmount}
                  onChange={handlePaymentChange}
                  step="0.01"
                  min="0"
                  max={isEditMode ? remainingBeforeNewPayment : totalAmount}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="0.00"
                />
              </div>

              {/* PhonePe/Bank Transaction ID */}
              {(paymentData.paymentMode === 'PhonePe' || paymentData.paymentMode === 'Bank') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {paymentData.paymentMode === 'PhonePe' ? 'Transaction ID / UPI Ref No' : 'Transaction ID / Reference No'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={paymentData.transactionId}
                    onChange={handlePaymentChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    placeholder={paymentData.paymentMode === 'PhonePe' ? 'Enter UPI Transaction ID' : 'Enter Bank Reference No'}
                    required={paymentData.paidAmount > 0}
                  />
                </div>
              )}

              {/* Bank Details */}
              {paymentData.paymentMode === 'Bank' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={paymentData.bankName}
                      onChange={handlePaymentChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                      placeholder="Enter Bank Name"
                      required={paymentData.paidAmount > 0}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number (Last 4 digits)
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={paymentData.accountNumber}
                      onChange={handlePaymentChange}
                      maxLength="4"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                      placeholder="Last 4 digits"
                    />
                  </div>
                </>
              )}

              {/* Payment Remarks */}
              {paymentData.paymentMode !== 'Cash' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Remarks
                  </label>
                  <input
                    type="text"
                    name="remarks"
                    value={paymentData.remarks}
                    onChange={handlePaymentChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    placeholder="Additional payment notes..."
                  />
                </div>
              )}
            </div>

            {paymentData.paidAmount && (
              <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Balance Amount:</span>
                  <span className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes / Remarks
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
              placeholder="Additional notes or remarks..."
            />
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
                  <span>{isEditMode ? 'Update Purchase' : 'Save Purchase'}</span>
                  <span className="hidden md:inline text-xs opacity-60 font-normal ml-1">Ctrl+S</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => safeNavigate('/raw-purchases')}
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

export default RawPurchaseEntry;
