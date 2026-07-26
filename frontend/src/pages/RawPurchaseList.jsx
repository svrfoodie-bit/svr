import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Edit, DollarSign, Package, Calendar, X, FileDown, Printer } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { printPurchaseReceipt } from '../utils/printUtils';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { supplierService } from '../services/supplierService';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { useDebounce } from '../hooks/useDebounce';
import usePagination from '../hooks/usePagination';
import useSort from '../hooks/useSort';
import Pagination from '../components/ui/Pagination';
import SortHeader from '../components/ui/SortHeader';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';

const RawPurchaseList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialSupplierId = new URLSearchParams(location.search).get('supplierId') || '';
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [summaryMetrics, setSummaryMetrics] = useState(null);

  const [filters, setFilters] = useState({
    timeRange: 'MONTH',
    supplierId: initialSupplierId,
    quality: '',
    paymentStatus: '',
  });

  // Debounce filter changes to reduce API calls
  const debouncedFilters = useDebounce(filters, 300);

  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    paidAmount: '',
    transactionId: '',
    bankName: '',
    accountNumber: '',
    remarks: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const supplierId = new URLSearchParams(location.search).get('supplierId') || '';
    setFilters(prev => (prev.supplierId === supplierId ? prev : { ...prev, supplierId }));
  }, [location.search]);

  useEffect(() => {
    loadPurchases();
  }, [debouncedFilters]);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      toast.error('Failed to load suppliers');
    }
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const data = await rawPurchaseService.getAll(debouncedFilters);
      setPurchases(data);

      const metrics = await rawPurchaseService.getSummaryMetrics(debouncedFilters);
      setSummaryMetrics(metrics);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await rawPurchaseService.addPayment(selectedPurchase.id, {
        ...paymentForm,
        paidAmount: parseFloat(paymentForm.paidAmount),
      });

      toast.success('Payment added successfully');
      setShowPaymentModal(false);
      setSelectedPurchase(null);
      setPaymentForm({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        paidAmount: '',
        transactionId: '',
        bankName: '',
        accountNumber: '',
        remarks: '',
      });
      loadPurchases();
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Credit':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Premium':
        return 'bg-green-100 text-green-700';
      case 'Mid':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN');

  const { sortKey, sortDir, setSort, sorted: sortedPurchases } = useSort(purchases, 'purchaseDate', 'desc');
  const { page, pageSize, setPage, paginated: pagedPurchases, totalPages, total } = usePagination(sortedPurchases, 25);

  const handleExportToExcel = () => {
    if (!purchases || purchases.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = purchases.map(purchase => ({
      'Date': new Date(purchase.purchaseDate).toLocaleDateString('en-IN'),
      'Supplier': purchase.supplierName,
      'Quality': purchase.rawQuality,
      'Quantity (KG)': purchase.quantityKg,
      'Price/KG': `₹${formatAmount(purchase.pricePerKg)}`,
      'Total Amount': `₹${formatAmount(purchase.totalAmount)}`,
      'Total Paid': `₹${formatAmount(purchase.totalPaid)}`,
      'Balance': `₹${formatAmount(purchase.balance)}`,
      'Payment Status': purchase.paymentStatus,
      'Remarks': purchase.remarks || ''
    }));

    exportToExcel(exportData, 'Raw_Purchases', { timeRange: filters.timeRange });
    toast.success('Report exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    if (!purchases || purchases.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = purchases.map(purchase => ({
      'Date': new Date(purchase.purchaseDate).toLocaleDateString('en-IN'),
      'Supplier': purchase.supplierName,
      'Quality': purchase.rawQuality,
      'Quantity': `${purchase.quantityKg} KG`,
      'Price/KG': `₹${formatAmount(purchase.pricePerKg)}`,
      'Total': `₹${formatAmount(purchase.totalAmount)}`,
      'Paid': `₹${formatAmount(purchase.totalPaid)}`,
      'Balance': `₹${formatAmount(purchase.balance)}`,
      'Status': purchase.paymentStatus
    }));

    const summary = summaryMetrics ? {
      'Total Quantity': `${summaryMetrics.totalQuantity || 0} KG`,
      'Total Value': `₹${formatAmount(summaryMetrics.totalValue)}`,
      'Total Paid': `₹${formatAmount(summaryMetrics.totalPaid)}`,
      'Outstanding': `₹${formatAmount(summaryMetrics.totalOutstanding)}`
    } : {};

    exportToPDF('Raw Purchases Report', exportData, summary, { timeRange: filters.timeRange });
    toast.success('PDF export opened in new window');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Raw Purchases</h1>
          <p className="text-sm text-gray-600 mt-1">Manage raw cashew purchases</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={loading || purchases.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportToPDF}
            disabled={loading || purchases.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => navigate('/raw-purchases/new')}
            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Purchase</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="DAY">Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier (RAW)</label>
                <select
                  value={filters.supplierId}
                  onChange={(e) => handleFilterChange('supplierId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="">All Suppliers (RAW)</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <select
                  value={filters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="">All Qualities</option>
                  <option value="Premium">Premium</option>
                  <option value="Mid">Mid</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Quantity</p>
                <p className="text-xl font-bold text-gray-900">{summaryMetrics.totalQuantity} KG</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">₹{Number(summaryMetrics.totalValue || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Paid</p>
                <p className="text-xl font-bold text-gray-900">₹{Number(summaryMetrics.totalPaid || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Outstanding</p>
                <p className="text-xl font-bold text-gray-900">₹{Number(summaryMetrics.totalOutstanding || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={10} />
      ) : (
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader col="purchaseDate" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={setSort} className="px-4 py-3" />
                <SortHeader col="supplierName" label="Supplier" sortKey={sortKey} sortDir={sortDir} onSort={setSort} className="px-4 py-3" />
                <SortHeader col="rawQuality" label="Quality" sortKey={sortKey} sortDir={sortDir} onSort={setSort} className="px-4 py-3" />
                <SortHeader col="quantityKg" label="Quantity" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" className="px-4 py-3" />
                <SortHeader col="pricePerKg" label="Price/KG" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" className="px-4 py-3" />
                <SortHeader col="totalAmount" label="Total" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" className="px-4 py-3" />
                <SortHeader col="totalPaid" label="Paid" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" className="px-4 py-3" />
                <SortHeader col="balance" label="Balance" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" className="px-4 py-3" />
                <SortHeader col="paymentStatus" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="center" className="px-4 py-3" />
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    <EmptyState
                      icon={Package}
                      message="No purchases found"
                      subtext={filters.supplierId || filters.quality || filters.paymentStatus ? 'Try adjusting your filters.' : 'Record your first raw purchase to get started.'}
                      action={!filters.supplierId && !filters.quality && !filters.paymentStatus ? { label: '+ New Purchase', onClick: () => navigate('/raw-purchases/new') } : null}
                    />
                  </td>
                </tr>
              ) : (
                pagedPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{purchase.supplierName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-lg ${getQualityColor(purchase.rawQuality)}`}>
                        {purchase.rawQuality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{purchase.quantityKg} KG</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">₹{purchase.pricePerKg}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">₹{Number(purchase.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">₹{Number(purchase.totalPaid || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">₹{Number(purchase.balance || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={purchase.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {purchase.balance > 0 && (
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setShowPaymentModal(true);
                            }}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Add Payment"
                          >
                            <DollarSign size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => printPurchaseReceipt(purchase)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/raw-purchases/edit/${purchase.id}`)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} total={total} />
        </div>
      </div>
      )}

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPurchase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowPaymentModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Add Payment</h3>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="px-6">
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Purchase Total: <span className="font-semibold text-gray-900">₹{formatAmount(selectedPurchase.totalAmount)}</span></p>
                  <p className="text-sm text-gray-600 mt-1">Already Paid: <span className="font-semibold text-green-600">₹{formatAmount(selectedPurchase.totalPaid)}</span></p>
                  <p className="text-sm text-gray-600 mt-1">Balance: <span className="font-semibold text-red-600">₹{formatAmount(selectedPurchase.balance)}</span></p>
                </div>

                <form id="paymentForm" onSubmit={handleAddPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      value={paymentForm.paymentMode}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Conditional Fields for PhonePe/Bank */}
                  {(paymentForm.paymentMode === 'PhonePe' || paymentForm.paymentMode === 'Bank') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID / UPI Ref No<span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={paymentForm.transactionId}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="Enter transaction ID"
                        required
                      />
                    </div>
                  )}

                  {paymentForm.paymentMode === 'Bank' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={paymentForm.bankName}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                          placeholder="Enter bank name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                        <input
                          type="text"
                          value={paymentForm.accountNumber}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                          placeholder="Enter account number"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentForm.paidAmount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                      max={selectedPurchase.balance}
                      step="0.01"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      value={paymentForm.remarks}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                      rows="2"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                      placeholder="Optional payment notes"
                    />
                  </div>

                </form>
                </div>

                <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      form="paymentForm"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all"
                    >
                      Add Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RawPurchaseList;
