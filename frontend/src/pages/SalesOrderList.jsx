import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, IndianRupee, AlertCircle, DollarSign, FileDown, Printer } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesOrderService } from '../services/salesOrderService';
import { salesPaymentService } from '../services/salesPaymentService';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { useDebounce } from '../hooks/useDebounce';
import usePagination from '../hooks/usePagination';
import useSort from '../hooks/useSort';
import Pagination from '../components/ui/Pagination';
import SortHeader from '../components/ui/SortHeader';
import EmptyState from '../components/ui/EmptyState';

const SalesOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    paymentType: '',
    paymentStatus: '',
    timeRange: 'MONTH',
  });
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    paidOrders: 0,
    pendingOrders: 0,
  });

  // Debounce filters to reduce API calls
  const debouncedFilters = useDebounce(filters, 300);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const normalizeOrder = (order) => {
    const orderTotal = Number(order.orderTotal ?? order.totalAmount ?? 0);
    const paidAmount = Number(order.paidAmount ?? order.totalPaid ?? 0);
    const outstandingAmount = Math.max(0, Number(order.outstandingAmount ?? order.outstanding ?? orderTotal - paidAmount));

    return {
      ...order,
      orderNumber: order.orderNumber || order.salesOrderId || `SO-${order.id}`,
      date: order.date || order.orderDate || order.createdAt,
      orderDate: order.orderDate || order.date || order.createdAt,
      paymentType: order.paymentType || 'Cash',
      orderTotal,
      paidAmount,
      totalPaid: paidAmount,
      outstandingAmount,
      outstanding: outstandingAmount,
      paymentStatus: order.paymentStatus || (outstandingAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending'),
    };
  };

  useEffect(() => {
    loadOrders();
    loadMetrics();
  }, [debouncedFilters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await salesOrderService.getAll(debouncedFilters);
      setOrders((data || []).map(normalizeOrder));
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await salesOrderService.getSummaryMetrics(debouncedFilters);
      setMetrics({
        totalOrders: Number(data?.totalOrders || 0),
        totalSales: Number(data?.totalSales || data?.totalAmount || 0),
        totalPaid: Number(data?.totalPaid || 0),
        totalOutstanding: Number(data?.totalOutstanding || 0),
        paidOrders: Number(data?.paidOrders || 0),
        pendingOrders: Number(data?.pendingOrders || 0),
      });
    } catch (error) {
    }
  };

  const { sortKey, sortDir, setSort, sorted: sortedOrders } = useSort(orders, 'orderDate', 'desc');
  const { page, pageSize, setPage, paginated: pagedOrders, totalPages, total } = usePagination(sortedOrders, 25);

  const handleAddPayment = (order) => {
    setSelectedOrder(order);
    setPaymentAmount(order.outstandingAmount.toString());
    setPaymentMode('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReference('');
    setPaymentRemarks('');
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);

    try {
      const amount = parseFloat(paymentAmount);

      // Validation
      if (amount <= 0) {
        toast.error('Payment amount must be greater than zero');
        setProcessingPayment(false);
        return;
      }

      if (amount > selectedOrder.outstandingAmount) {
        toast.error('Payment amount cannot exceed outstanding amount');
        setProcessingPayment(false);
        return;
      }

      // Create payment record
      await salesPaymentService.create({
        salesOrderId: selectedOrder.id,
        paymentDate,
        amount,
        paymentMode,
        reference: paymentReference,
        notes: paymentRemarks,
      });

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      loadOrders();
      loadMetrics();
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleExportToExcel = () => {
    if (!orders || orders.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Date': new Date(order.date).toLocaleDateString('en-IN'),
      'Customer': order.customerName,
      'Payment Type': order.paymentType,
      'Order Total': money(order.orderTotal),
      'Paid Amount': money(order.paidAmount),
      'Outstanding': money(order.outstandingAmount),
      'Payment Status': order.paymentStatus,
      'Remarks': order.remarks || ''
    }));

    exportToExcel(exportData, 'Sales_Orders', { timeRange: filters.timeRange });
    toast.success('Report exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    if (!orders || orders.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = orders.map(order => ({
      'Order No': order.orderNumber,
      'Date': new Date(order.date).toLocaleDateString('en-IN'),
      'Customer': order.customerName,
      'Payment Type': order.paymentType,
      'Order Total': money(order.orderTotal),
      'Paid': money(order.paidAmount),
      'Outstanding': money(order.outstandingAmount),
      'Status': order.paymentStatus
    }));

    const summary = {
      'Total Orders': metrics.totalOrders,
      'Total Sales': money(metrics.totalSales),
      'Total Collected': money(metrics.totalPaid),
      'Total Outstanding': money(metrics.totalOutstanding),
      'Paid Orders': metrics.paidOrders,
      'Pending Orders': metrics.pendingOrders
    };

    exportToPDF('Sales Orders Report', exportData, summary, { timeRange: filters.timeRange });
    toast.success('PDF export opened in new window');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Manage customer orders and sales</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportToExcel}
            disabled={loading || orders.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportToPDF}
            disabled={loading || orders.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => navigate('/sales-orders/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Order</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalOrders}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">{money(metrics.totalSales)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Collected</p>
              <p className="text-xl font-bold text-gray-900">{money(metrics.totalPaid)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">{money(metrics.totalOutstanding)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Range Filter */}
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>

          {/* Payment Type Filter */}
          <select
            value={filters.paymentType}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Payment Types</option>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader col="orderId" label="Order No" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="orderDate" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="customerName" label="Customer" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="paymentType" label="Payment Type" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="center" />
                <SortHeader col="orderTotal" label="Order Total" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="paidAmount" label="Paid" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="outstanding" label="Outstanding" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="paymentStatus" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="center" />
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <EmptyState
                      icon={ShoppingCart}
                      message="No sales orders found"
                      subtext={filters.customerId || filters.paymentStatus || filters.search ? 'Try adjusting your filters.' : 'Create your first sales order to get started.'}
                      action={!filters.customerId && !filters.paymentStatus && !filters.search ? { label: '+ New Sales Order', onClick: () => navigate('/sales-orders/new') } : null}
                    />
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-600">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{order.customerName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={order.paymentType} />
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {money(order.orderTotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      {money(order.paidAmount)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-red-600">
                      {money(order.outstandingAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {order.outstandingAmount > 0 && (
                          <button
                            onClick={() => handleAddPayment(order)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                          >
                            Add Payment
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/invoice/${order.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} total={total} />
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !processingPayment && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Payment</h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Order Number:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Order Total:</span>
                  <span className="text-sm font-semibold text-gray-900">{money(selectedOrder.orderTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outstanding:</span>
                  <span className="text-sm font-bold text-red-600">{money(selectedOrder.outstandingAmount)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    max={selectedOrder.outstandingAmount}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {(paymentMode === 'UPI' || paymentMode === 'Cheque' || paymentMode === 'Bank Transfer') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                      placeholder="Transaction/Cheque number"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                    rows="2"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Record Payment</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={processingPayment}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesOrderList;
