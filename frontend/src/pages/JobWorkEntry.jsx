import { useState, useEffect } from 'react';
import { Save, X, History, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { jobWorkService } from '../services/jobWorkService';
import { workerService } from '../services/workerService';
import useUnsavedChanges from '../hooks/useUnsavedChanges';

const JobWorkEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { markDirty, markClean, safeNavigate, ConfirmDialog } = useUnsavedChanges();

  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [existingPayments, setExistingPayments] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    jobDate: new Date().toISOString().split('T')[0],
    jobWorkerName: '',
    cashewType: 'Premium',
    status: 'In Progress',
    quantitySent: '',
    quantityReceived: '',
    ratePerKg: '',
    remarks: '',
  });

  const [paymentData, setPaymentData] = useState({
    paymentMode: 'Cash',
    paidAmount: '',
    transactionId: '',
    bankName: '',
    accountNumber: '',
    remarks: '',
  });

  useEffect(() => {
    loadWorkers();
    if (isEditMode) loadJobWorkData();
  }, [id]);

  const loadWorkers = async () => {
    try {
      const data = await workerService.getActive();
      setWorkers(data || []);
    } catch {
      toast.error('Failed to load workers');
    }
  };

  const loadJobWorkData = async () => {
    try {
      const jobWork = await jobWorkService.getById(id);
      if (jobWork) {
        setFormData({
          jobDate: jobWork.jobDate,
          jobWorkerName: jobWork.jobWorkerName,
          cashewType: jobWork.cashewType,
          status: jobWork.status || 'In Progress',
          quantitySent: jobWork.quantitySent,
          quantityReceived: jobWork.quantityReceived,
          ratePerKg: jobWork.ratePerKg,
          remarks: jobWork.remarks || '',
        });
        const payments = await jobWorkService.getPayments(id);
        setExistingPayments(payments || []);
      } else {
        toast.error('Job work not found');
        navigate('/job-work');
      }
    } catch {
      toast.error('Failed to load job work data');
    }
  };

  // ── Validation ───────────────────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'jobWorkerName':
        return !value ? 'Please select a worker' : '';
      case 'quantitySent':
        if (!value) return 'Quantity sent is required';
        if (parseFloat(value) <= 0) return 'Must be greater than 0';
        return '';
      case 'quantityReceived':
        if (!value) return 'Quantity received is required';
        if (parseFloat(value) < 0) return 'Cannot be negative';
        if (formData.quantitySent && parseFloat(value) > parseFloat(formData.quantitySent))
          return `Cannot exceed sent quantity (${formData.quantitySent} KG)`;
        return '';
      case 'ratePerKg':
        if (!value) return 'Rate is required';
        if (parseFloat(value) <= 0) return 'Must be greater than 0';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    markDirty();
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    markDirty();
  };

  const validateAll = () => {
    const fields = ['jobWorkerName', 'quantitySent', 'quantityReceived', 'ratePerKg'];
    const newErrors = {};
    fields.forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      const jobWork = {
        ...formData,
        quantitySent: parseFloat(formData.quantitySent),
        quantityReceived: parseFloat(formData.quantityReceived),
        ratePerKg: parseFloat(formData.ratePerKg),
      };

      if (isEditMode) {
        await jobWorkService.update(id, jobWork);
        if (paymentData.paidAmount) {
          await jobWorkService.addPayment(id, {
            paymentMode: paymentData.paymentMode,
            paidAmount: parseFloat(paymentData.paidAmount),
            paymentDate: formData.jobDate,
            transactionId: paymentData.transactionId,
            remarks: paymentData.remarks,
          });
        }
        toast.success('Job work updated successfully');
      } else {
        const created = await jobWorkService.create(jobWork);
        if (paymentData.paidAmount) {
          await jobWorkService.addPayment(created.id, {
            paymentMode: paymentData.paymentMode,
            paidAmount: parseFloat(paymentData.paidAmount),
            paymentDate: formData.jobDate,
            transactionId: paymentData.transactionId,
            remarks: paymentData.remarks,
          });
        }
        toast.success('Job work recorded successfully');
      }
      markClean();
      navigate('/job-work');
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update job work' : 'Failed to save job work');
    } finally {
      setLoading(false);
    }
  };

  // ── Computed values ──────────────────────────────────────────
  const sentQty    = parseFloat(formData.quantitySent) || 0;
  const recvQty    = parseFloat(formData.quantityReceived) || 0;
  const rate       = parseFloat(formData.ratePerKg) || 0;
  const lossKg     = Math.max(0, sentQty - recvQty).toFixed(2);
  const lossPct    = sentQty > 0 ? ((sentQty - recvQty) / sentQty * 100).toFixed(1) : '0.0';
  const totalCost  = (recvQty * rate).toFixed(2);
  const paidAmt    = parseFloat(paymentData.paidAmount) || 0;
  const balance    = parseFloat(totalCost) - paidAmt;

  const inputCls = (field) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50 focus:ring-red-500/20'
        : 'border-gray-200 focus:ring-primary-500/30 focus:border-primary-500'
    }`;

  useKeyboardSave(handleSubmit);
  return (
    <div className="p-4 md:p-6">
      <ConfirmDialog />
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Job Work' : 'New Job Work'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update job work details' : 'Record outside steaming job work'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">

          {/* Job Date & Worker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="jobDate"
                value={formData.jobDate}
                onChange={handleInputChange}
                className={inputCls('jobDate')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Worker <span className="text-red-500">*</span>
              </label>
              <select
                name="jobWorkerName"
                value={formData.jobWorkerName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={inputCls('jobWorkerName')}
              >
                <option value="">Select worker...</option>
                {workers.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
              {touched.jobWorkerName && errors.jobWorkerName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.jobWorkerName}
                </p>
              )}
              {workers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No active workers found. <a href="/workers/new" className="underline">Add a worker</a> first.</p>
              )}
            </div>
          </div>

          {/* Cashew Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cashew Type <span className="text-red-500">*</span>
              </label>
              <select name="cashewType" value={formData.cashewType} onChange={handleInputChange} className={inputCls('cashewType')}>
                <option value="Premium">Premium</option>
                <option value="Mid">Mid</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select name="status" value={formData.status} onChange={handleInputChange} className={inputCls('status')}>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Quantities & Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity Sent (KG) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="quantitySent" value={formData.quantitySent}
                onChange={handleInputChange} onBlur={handleBlur}
                step="0.01" min="0" placeholder="0.00"
                className={inputCls('quantitySent')}
              />
              {touched.quantitySent && errors.quantitySent && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.quantitySent}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity Received (KG) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="quantityReceived" value={formData.quantityReceived}
                onChange={handleInputChange} onBlur={handleBlur}
                step="0.01" min="0" placeholder="0.00"
                className={inputCls('quantityReceived')}
              />
              {touched.quantityReceived && errors.quantityReceived && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.quantityReceived}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate per KG (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" name="ratePerKg" value={formData.ratePerKg}
                onChange={handleInputChange} onBlur={handleBlur}
                step="0.01" min="0" placeholder="0.00"
                className={inputCls('ratePerKg')}
              />
              {touched.ratePerKg && errors.ratePerKg && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.ratePerKg}</p>
              )}
            </div>
          </div>

          {/* Live Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-xl p-4 border ${parseFloat(lossPct) > 10 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className="text-xs font-medium text-gray-500 mb-1">Loss Quantity</p>
              <p className={`text-2xl font-bold ${parseFloat(lossPct) > 10 ? 'text-red-600' : 'text-orange-600'}`}>{lossKg} KG</p>
              <p className={`text-sm font-semibold mt-0.5 ${parseFloat(lossPct) > 10 ? 'text-red-500' : 'text-orange-500'}`}>
                {lossPct}% loss
                {parseFloat(lossPct) > 10 && <span className="ml-1 text-xs">(High!)</span>}
              </p>
            </div>

            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-primary-600">₹{parseFloat(totalCost).toLocaleString('en-IN')}</p>
              <p className="text-sm text-primary-500">{recvQty} KG × ₹{rate}/KG</p>
            </div>

            <div className={`rounded-xl p-4 border ${balance > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-xs font-medium text-gray-500 mb-1">Balance</p>
              <p className={`text-2xl font-bold ${balance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                ₹{Math.abs(balance).toLocaleString('en-IN')}
              </p>
              <p className={`text-sm ${balance > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {balance > 0 ? 'Pending' : balance < 0 ? 'Overpaid' : 'Fully Paid'}
              </p>
            </div>
          </div>

          {/* Payment History (Edit Mode) */}
          {isEditMode && existingPayments.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Payment History</h3>
                <span className="ml-auto text-sm font-bold text-green-600">
                  Total Paid: ₹{existingPayments.reduce((s, p) => s + p.paidAmount, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="space-y-2">
                {existingPayments.map((payment, idx) => (
                  <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">{idx + 1}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">₹{payment.paidAmount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString('en-IN')} · {payment.paymentMode}</p>
                      </div>
                    </div>
                    {payment.transactionId && <span className="text-xs text-gray-400 font-mono">{payment.transactionId}</span>}
                  </div>
                ))}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                <select name="paymentMode" value={paymentData.paymentMode} onChange={handlePaymentChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all">
                  <option value="Cash">Cash</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paid Amount (₹)
                  {parseFloat(totalCost) > 0 && (
                    <button type="button" onClick={() => setPaymentData(p => ({ ...p, paidAmount: totalCost }))}
                      className="ml-2 text-xs text-primary-600 hover:underline">Pay Full</button>
                  )}
                </label>
                <input type="number" name="paidAmount" value={paymentData.paidAmount}
                  onChange={handlePaymentChange} step="0.01" min="0" max={totalCost}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
              </div>

              {(paymentData.paymentMode === 'PhonePe' || paymentData.paymentMode === 'Bank') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {paymentData.paymentMode === 'PhonePe' ? 'UPI Transaction ID' : 'Bank Reference No'}
                    {paymentData.paidAmount && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input type="text" name="transactionId" value={paymentData.transactionId}
                    onChange={handlePaymentChange}
                    placeholder={paymentData.paymentMode === 'PhonePe' ? 'UPI Ref No' : 'Bank Ref No'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                </div>
              )}

              {paymentData.paymentMode === 'Bank' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                  <input type="text" name="bankName" value={paymentData.bankName}
                    onChange={handlePaymentChange} placeholder="Bank name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange}
              rows="2"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
              placeholder="Additional remarks..." />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
              ) : (
                <><Save size={20} /><span>{isEditMode ? 'Update Job Work' : 'Save Job Work'}</span><span className="hidden md:inline text-xs opacity-60 font-normal ml-1">Ctrl+S</span></>
              )}
            </button>
            <button type="button" onClick={() => safeNavigate('/job-work')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2">
              <X size={20} /><span>Cancel</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobWorkEntry;
