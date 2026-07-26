import { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { motion } from 'framer-motion';
import {
  CreditCard,
  FileDown,
  Printer,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import DateRangePicker from '../components/DateRangePicker';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { jobWorkService } from '../services/jobWorkService';
import { salesOrderService } from '../services/salesOrderService';
import { salesPaymentService } from '../services/salesPaymentService';
import { expenseService } from '../services/expenseService';

const PaymentsManagement = () => {
  // Date filter state
  const [timeRange, setTimeRange] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter state
  const [moduleFilter, setModuleFilter] = useState('ALL'); // ALL, RAW_PURCHASE, JOB_WORK, SALES, EXPENSE
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL'); // ALL, CASH, PHONEPE, BANK
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL'); // ALL, PAID, PARTIAL, PENDING
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Data state
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summary metrics
  const [metrics, setMetrics] = useState({
    totalCollections: 0,
    totalOutstanding: 0,
    cashCollections: 0,
    phonepeCollections: 0,
    bankCollections: 0,
    totalTransactions: 0
  });

  // Load all payments from all modules
  useEffect(() => {
    loadAllPayments();
  }, [timeRange, startDate, endDate]);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [payments, moduleFilter, paymentModeFilter, paymentStatusFilter, debouncedSearch]);

  const loadAllPayments = async () => {
    setLoading(true);
    try {
      const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };

      const [
        rawPurchases,
        jobWorks,
        salesOrders,
        rawPurchasePayments,
        jobWorkPayments,
        salesPayments,
        expenses
      ] = await Promise.all([
        rawPurchaseService.getAll(filters),
        jobWorkService.getAll(filters),
        salesOrderService.getAll(filters),
        rawPurchaseService.getAllPayments(filters),
        jobWorkService.getAllPayments(filters),
        salesPaymentService.getAll(filters),
        expenseService.getAll(filters)
      ]);

      const purchaseMap = new Map(rawPurchases.map((purchase) => [purchase.id, purchase]));
      const jobWorkMap = new Map(jobWorks.map((job) => [job.id, job]));
      const salesOrderMap = new Map(salesOrders.map((order) => [order.id, order]));

      const allPayments = [
        ...transformRawPurchasePayments(rawPurchasePayments, purchaseMap),
        ...transformJobWorkPayments(jobWorkPayments, jobWorkMap),
        ...transformSalesPayments(salesPayments, salesOrderMap),
        ...transformExpensePayments(expenses)
      ];

      // Sort by date (newest first)
      allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

      setPayments(allPayments);
      calculateMetrics(allPayments);
    } catch (error) {
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  const transformRawPurchasePayments = (payments, purchaseMap) => {
    return payments.map((payment) => {
      const purchase = purchaseMap.get(payment.rawPurchaseId) || {};
      const totalAmount = parseFloat(purchase.totalAmount || 0);
      const outstandingAmount = Math.max(0, parseFloat(purchase.balance || 0));
      return {
        id: `RPP-${payment.id}`,
        parentKey: `RAW_PURCHASE-${payment.rawPurchaseId}`,
        module: 'Raw Purchase',
        moduleType: 'RAW_PURCHASE',
        date: payment.paymentDate,
        party: payment.supplierName || purchase.supplierName || '-',
        amount: parseFloat(payment.paidAmount || payment.amount || 0),
        paymentMode: payment.paymentMode === 'UPI' ? 'PhonePe' : payment.paymentMode === 'Bank Transfer' ? 'Bank' : (payment.paymentMode || 'Cash'),
        transactionId: payment.transactionId || payment.reference || null,
        bankName: payment.bankName || null,
        status: outstandingAmount > 0 ? 'PARTIAL' : 'PAID',
        totalAmount,
        paidAmount: parseFloat(purchase.totalPaid || 0),
        outstandingAmount,
        referenceNo: purchase.purchaseCode || `RP-${payment.rawPurchaseId}`,
        description: `Raw Purchase - ${parseFloat(purchase.quantityKg || purchase.quantity || 0).toFixed(0)} Kg`
      };
    });
  };

  const transformJobWorkPayments = (payments, jobWorkMap) => {
    return payments.map((payment) => {
      const job = jobWorkMap.get(payment.jobWorkId) || {};
      const totalAmount = parseFloat(job.totalCost || (parseFloat(job.quantityReceived || 0) * parseFloat(job.ratePerKg || 0)));
      const outstandingAmount = Math.max(0, parseFloat(job.balance || 0));
      return {
        id: `JWP-${payment.id}`,
        parentKey: `JOB_WORK-${payment.jobWorkId}`,
        module: 'Job Work',
        moduleType: 'JOB_WORK',
        date: payment.paymentDate,
        party: payment.jobWorkerName || job.jobWorkerName || '-',
        amount: parseFloat(payment.paidAmount || payment.amount || 0),
        paymentMode: payment.paymentMode || 'Cash',
        transactionId: payment.transactionId || payment.reference || null,
        bankName: payment.bankName || null,
        status: outstandingAmount > 0 ? 'PARTIAL' : 'PAID',
        totalAmount,
        paidAmount: parseFloat(job.totalPaid || 0),
        outstandingAmount,
        referenceNo: job.jobWorkCode || `JW-${payment.jobWorkId}`,
        description: `Job Work - ${parseFloat(job.quantitySent || 0).toFixed(0)} Kg sent`
      };
    });
  };

  const transformSalesPayments = (payments, salesOrderMap) => {
    return payments.map((payment) => {
      const order = salesOrderMap.get(payment.salesOrderId) || {};
      const totalAmount = parseFloat(order.totalAmount || 0);
      const outstandingAmount = Math.max(0, parseFloat(order.outstanding || 0));
      return {
        id: `SP-${payment.id}`,
        parentKey: `SALES-${payment.salesOrderId}`,
        module: 'Sales Order',
        moduleType: 'SALES',
        date: payment.paymentDate,
        party: payment.customerName || order.customerName || '-',
        amount: parseFloat(payment.amount || 0),
        paymentMode: payment.paymentMode === 'UPI' ? 'PhonePe' : payment.paymentMode === 'Bank Transfer' ? 'Bank' : (payment.paymentMode || 'Cash'),
        transactionId: payment.reference || null,
        bankName: null,
        status: outstandingAmount > 0 ? 'PARTIAL' : 'PAID',
        totalAmount,
        paidAmount: parseFloat(order.paidAmount || 0),
        outstandingAmount,
        referenceNo: payment.salesOrderId || order.orderNumber || `SO-${payment.salesOrderId}`,
        description: `Sales - ${order.productGrade || order.grade || ''} cashew`
      };
    });
  };

  const transformExpensePayments = (expenses) => {
    return expenses.map(expense => {
      const amount = parseFloat(expense.amount || 0);
      return {
        id: `EXP-${expense.id}`,
        parentKey: `EXPENSE-${expense.id}`,
        module: 'Expense',
        moduleType: 'EXPENSE',
        date: expense.date,
        party: expense.paidTo || expense.vendorName || expense.category || '-',
        amount,
        paymentMode: expense.paymentMode || 'Cash',
        transactionId: expense.transactionId || null,
        bankName: null,
        status: 'PAID',
        totalAmount: amount,
        paidAmount: amount,
        outstandingAmount: 0,
        referenceNo: expense.expenseCode || expense.expenseNumber || `EXP-${expense.id}`,
        description: `${expense.category || ''} - ${expense.description || ''}`
      };
    });
  };

  const calculateMetrics = (paymentsData) => {
    const totalCollections = paymentsData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const outstandingByParent = new Map();
    paymentsData.forEach((payment) => {
      if (payment.outstandingAmount > 0 && payment.parentKey && !outstandingByParent.has(payment.parentKey)) {
        outstandingByParent.set(payment.parentKey, parseFloat(payment.outstandingAmount) || 0);
      }
    });
    const totalOutstanding = Array.from(outstandingByParent.values()).reduce((sum, amount) => sum + amount, 0);

    const cashCollections = paymentsData
      .filter(p => p.paymentMode?.toLowerCase() === 'cash')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const phonepeCollections = paymentsData
      .filter(p => p.paymentMode?.toLowerCase() === 'phonepe')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const bankCollections = paymentsData
      .filter(p => p.paymentMode?.toLowerCase() === 'bank')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    setMetrics({
      totalCollections,
      totalOutstanding,
      cashCollections,
      phonepeCollections,
      bankCollections,
      totalTransactions: paymentsData.length
    });
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Module filter
    if (moduleFilter !== 'ALL') {
      filtered = filtered.filter(p => p.moduleType === moduleFilter);
    }

    // Payment mode filter
    if (paymentModeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.paymentMode?.toLowerCase() === paymentModeFilter.toLowerCase());
    }

    // Payment status filter
    if (paymentStatusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === paymentStatusFilter);
    }

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.party?.toLowerCase().includes(search) ||
        p.referenceNo?.toLowerCase().includes(search) ||
        p.transactionId?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }

    setFilteredPayments(filtered);
    calculateMetrics(filtered);
  };

  const handleExportToExcel = () => {
    if (filteredPayments.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredPayments.map(p => ({
      Date: new Date(p.date).toLocaleDateString('en-IN'),
      Module: p.module,
      'Reference No': p.referenceNo,
      Party: p.party,
      Description: p.description,
      'Payment Mode': p.paymentMode,
      Amount: `₹${p.amount.toLocaleString('en-IN')}`,
      'Transaction ID': p.transactionId || '-',
      'Bank Name': p.bankName || '-',
      Status: p.status,
      'Total Amount': `₹${p.totalAmount.toLocaleString('en-IN')}`,
      'Paid Amount': `₹${p.paidAmount.toLocaleString('en-IN')}`,
      'Outstanding': `₹${p.outstandingAmount.toLocaleString('en-IN')}`
    }));

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToExcel(exportData, 'Payments_Management_Report', filters);
    toast.success('Exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    if (filteredPayments.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredPayments.map(p => ({
      Date: new Date(p.date).toLocaleDateString('en-IN'),
      Module: p.module,
      Party: p.party,
      'Payment Mode': p.paymentMode,
      Amount: `₹${p.amount.toLocaleString('en-IN')}`,
      Status: p.status,
      Outstanding: `₹${p.outstandingAmount.toLocaleString('en-IN')}`
    }));

    const summary = {
      'Total Collections': `₹${metrics.totalCollections.toLocaleString('en-IN')}`,
      'Total Outstanding': `₹${metrics.totalOutstanding.toLocaleString('en-IN')}`,
      'Cash Collections': `₹${metrics.cashCollections.toLocaleString('en-IN')}`,
      'PhonePe Collections': `₹${metrics.phonepeCollections.toLocaleString('en-IN')}`,
      'Bank Collections': `₹${metrics.bankCollections.toLocaleString('en-IN')}`,
      'Total Transactions': metrics.totalTransactions
    };

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToPDF('Payments Management Report', exportData, summary, filters);
    toast.success('Exported to PDF successfully');
  };

  const getStatusBadge = (status) => {
    const styles = {
      PAID: 'bg-green-100 text-green-700',
      PARTIAL: 'bg-yellow-100 text-yellow-700',
      PENDING: 'bg-red-100 text-red-700',
      CREDIT: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const getPaymentModeBadge = (mode) => {
    const styles = {
      Cash: 'bg-blue-100 text-blue-700',
      PhonePe: 'bg-purple-100 text-purple-700',
      Bank: 'bg-indigo-100 text-indigo-700',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[mode] || 'bg-gray-100 text-gray-700'}`}>
        {mode}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-soft">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
            <p className="text-sm text-gray-600">Consolidated view of all payments across modules</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
              Collections
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            ₹{metrics.totalCollections.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-green-700 mt-1">Total Collections</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-red-600" />
            <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">
              Outstanding
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900">
            ₹{metrics.totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-red-700 mt-1">Total Outstanding</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              Cash
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ₹{metrics.cashCollections.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-blue-700 mt-1">Cash Payments</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              Transactions
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {metrics.totalTransactions}
          </p>
          <p className="text-xs text-purple-700 mt-1">Total Transactions</p>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Date Range Picker */}
          <DateRangePicker
            timeRange={timeRange}
            startDate={startDate}
            endDate={endDate}
            onTimeRangeChange={setTimeRange}
            onCustomDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setTimeRange('CUSTOM');
            }}
            showAllTime={true}
          />

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="ALL">All Modules</option>
            <option value="RAW_PURCHASE">Raw Purchase</option>
            <option value="JOB_WORK">Job Work</option>
            <option value="SALES">Sales Orders</option>
            <option value="EXPENSE">Expenses</option>
          </select>

          {/* Payment Mode Filter */}
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="PHONEPE">PhonePe</option>
            <option value="BANK">Bank Transfer</option>
          </select>

          {/* Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
            <option value="CREDIT">Credit</option>
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by party, reference, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportToExcel}
              disabled={loading || filteredPayments.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-5 h-5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportToPDF}
              disabled={loading || filteredPayments.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payments found for the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Party</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900">{payment.module}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {payment.referenceNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payment.party}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.description}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getPaymentModeBadge(payment.paymentMode)}
                      {payment.transactionId && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          ID: {payment.transactionId}
                        </div>
                      )}
                      {payment.bankName && (
                        <div className="text-xs text-gray-500 font-mono">
                          {payment.bankName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {payment.outstandingAmount > 0 ? (
                        <span className="font-semibold text-red-600">
                          ₹{payment.outstandingAmount.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Mode Breakdown */}
      {!loading && filteredPayments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-semibold">Cash Collections</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{metrics.cashCollections.toLocaleString('en-IN')}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-semibold">PhonePe Collections</p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{metrics.phonepeCollections.toLocaleString('en-IN')}
                </p>
              </div>
              <CreditCard className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700 font-semibold">Bank Collections</p>
                <p className="text-2xl font-bold text-indigo-900">
                  ₹{metrics.bankCollections.toLocaleString('en-IN')}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-indigo-600 opacity-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;
