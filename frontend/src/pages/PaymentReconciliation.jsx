import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  FileDown,
  Link as LinkIcon,
  Unlink,
  Calendar,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import DateRangePicker from '../components/DateRangePicker';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { jobWorkService } from '../services/jobWorkService';
import { salesOrderService } from '../services/salesOrderService';

const PaymentReconciliation = () => {
  // Date filter state
  const [timeRange, setTimeRange] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter state
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [reconciliationStatus, setReconciliationStatus] = useState('ALL'); // ALL, MATCHED, UNMATCHED, PARTIAL
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [reconciliationData, setReconciliationData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summary metrics
  const [metrics, setMetrics] = useState({
    totalInvoices: 0,
    matchedInvoices: 0,
    unmatchedInvoices: 0,
    partiallyMatchedInvoices: 0,
    totalInvoiceAmount: 0,
    totalReceivedAmount: 0,
    totalDiscrepancy: 0
  });

  // Load reconciliation data
  useEffect(() => {
    loadReconciliationData();
  }, [timeRange, startDate, endDate]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [reconciliationData, moduleFilter, reconciliationStatus, searchTerm]);

  const loadReconciliationData = async () => {
    setLoading(true);
    try {
      const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };

      // Fetch data from all modules in parallel
      const [rawPurchases, jobWorks, salesOrders] = await Promise.all([
        rawPurchaseService.getAll(filters),
        jobWorkService.getAll(filters),
        salesOrderService.getAll(filters)
      ]);

      // Transform data into reconciliation format
      const allRecords = [
        ...transformRawPurchaseReconciliation(rawPurchases),
        ...transformJobWorkReconciliation(jobWorks),
        ...transformSalesReconciliation(salesOrders)
      ];

      // Sort by date (newest first)
      allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

      setReconciliationData(allRecords);
      calculateMetrics(allRecords);
    } catch (error) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const transformRawPurchaseReconciliation = (purchases) => {
    return purchases.map((purchase, index) => {
      const totalInvoiceAmount = parseFloat(purchase.totalAmount || 0);
      const totalPaid = parseFloat(purchase.totalPaid ?? purchase.paidAmount ?? purchase.amountPaid ?? 0);
      const discrepancy = totalInvoiceAmount - totalPaid;

      let status = 'UNMATCHED';
      if (totalPaid === 0) {
        status = 'UNMATCHED';
      } else if (totalPaid >= totalInvoiceAmount) {
        status = 'MATCHED';
      } else {
        status = 'PARTIAL';
      }

      return {
        id: `RAW-${purchase.id ?? purchase._id ?? index}`,
        module: 'Raw Purchase',
        moduleType: 'RAW_PURCHASE',
        date: purchase.purchaseDate || purchase.date || new Date().toISOString(),
        referenceNo: purchase.purchaseCode || purchase.purchaseNo || `RP-${purchase.id ?? index}`,
        party: purchase.supplierName || purchase.farmerName || '-',
        invoiceAmount: totalInvoiceAmount,
        receivedAmount: totalPaid,
        discrepancy: Math.abs(discrepancy),
        discrepancyType: discrepancy > 0 ? 'UNDERPAID' : discrepancy < 0 ? 'OVERPAID' : 'NONE',
        status: status,
        paymentCount: purchase.paymentTransactions?.length || 0,
        lastPaymentDate: purchase.paymentTransactions?.[purchase.paymentTransactions.length - 1]?.paymentDate || null,
        description: `${parseFloat(purchase.quantityKg ?? purchase.quantity ?? 0)} kg raw cashew`
      };
    });
  };

  const transformJobWorkReconciliation = (jobWorks) => {
    return jobWorks.map((job, index) => {
      const fallbackAmount =
        (parseFloat(job.quantityReceived || 0) * parseFloat(job.ratePerKg || 0)) || 0;
      const totalInvoiceAmount = parseFloat(job.totalAmount ?? fallbackAmount);
      const totalPaid = parseFloat(job.totalPaid ?? job.paidAmount ?? job.amountPaid ?? 0);
      const discrepancy = totalInvoiceAmount - totalPaid;

      let status = 'UNMATCHED';
      if (totalPaid === 0) {
        status = 'UNMATCHED';
      } else if (totalPaid >= totalInvoiceAmount) {
        status = 'MATCHED';
      } else {
        status = 'PARTIAL';
      }

      return {
        id: `JOB-${job.id ?? job._id ?? index}`,
        module: 'Job Work',
        moduleType: 'JOB_WORK',
        date: job.jobDate || job.date || new Date().toISOString(),
        referenceNo: job.jobWorkCode || job.jobWorkNo || `JW-${job.id ?? index}`,
        party: job.jobWorkerName || job.processorName || '-',
        invoiceAmount: totalInvoiceAmount,
        receivedAmount: totalPaid,
        discrepancy: Math.abs(discrepancy),
        discrepancyType: discrepancy > 0 ? 'UNDERPAID' : discrepancy < 0 ? 'OVERPAID' : 'NONE',
        status: status,
        paymentCount: job.paymentTransactions?.length || 0,
        lastPaymentDate: job.paymentTransactions?.[job.paymentTransactions.length - 1]?.paymentDate || null,
        description: `${parseFloat(job.quantitySent || 0)} kg processed`
      };
    });
  };

  const transformSalesReconciliation = (orders) => {
    return orders.map((order, index) => {
      const totalInvoiceAmount = parseFloat(order.totalAmount || 0);
      const totalPaid = parseFloat(order.paidAmount ?? order.amountPaid ?? order.totalPaid ?? 0);
      const discrepancy = totalInvoiceAmount - totalPaid;

      let status = 'UNMATCHED';
      if (totalPaid === 0) {
        status = 'UNMATCHED';
      } else if (totalPaid >= totalInvoiceAmount) {
        status = 'MATCHED';
      } else {
        status = 'PARTIAL';
      }

      return {
        id: `SALE-${order.id ?? order._id ?? index}`,
        module: 'Sales Order',
        moduleType: 'SALES',
        date: order.orderDate || order.createdAt || order.date || new Date().toISOString(),
        referenceNo: order.orderCode || order.orderNo || order.salesOrderId || `SO-${order.id ?? index}`,
        party: order.customerName,
        invoiceAmount: totalInvoiceAmount,
        receivedAmount: totalPaid,
        discrepancy: Math.abs(discrepancy),
        discrepancyType: discrepancy > 0 ? 'UNDERPAID' : discrepancy < 0 ? 'OVERPAID' : 'NONE',
        status: status,
        paymentCount: order.paymentTransactions?.length || 0,
        lastPaymentDate: order.paymentTransactions?.[order.paymentTransactions.length - 1]?.paymentDate || null,
        description: `${order.grade} cashew sale`
      };
    });
  };

  const calculateMetrics = (data) => {
    const matched = data.filter(d => d.status === 'MATCHED').length;
    const unmatched = data.filter(d => d.status === 'UNMATCHED').length;
    const partial = data.filter(d => d.status === 'PARTIAL').length;

    const totalInvoice = data.reduce((sum, d) => sum + d.invoiceAmount, 0);
    const totalReceived = data.reduce((sum, d) => sum + d.receivedAmount, 0);
    const totalDisc = data.reduce((sum, d) => sum + (d.discrepancyType === 'UNDERPAID' ? d.discrepancy : 0), 0);

    setMetrics({
      totalInvoices: data.length,
      matchedInvoices: matched,
      unmatchedInvoices: unmatched,
      partiallyMatchedInvoices: partial,
      totalInvoiceAmount: totalInvoice,
      totalReceivedAmount: totalReceived,
      totalDiscrepancy: totalDisc
    });
  };

  const applyFilters = () => {
    let filtered = [...reconciliationData];

    // Module filter
    if (moduleFilter !== 'ALL') {
      filtered = filtered.filter(d => d.moduleType === moduleFilter);
    }

    // Reconciliation status filter
    if (reconciliationStatus !== 'ALL') {
      filtered = filtered.filter(d => d.status === reconciliationStatus);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.party?.toLowerCase().includes(search) ||
        d.referenceNo?.toLowerCase().includes(search) ||
        d.description?.toLowerCase().includes(search)
      );
    }

    setFilteredData(filtered);
    calculateMetrics(filtered);
  };

  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredData.map(d => ({
      Date: new Date(d.date).toLocaleDateString('en-IN'),
      Module: d.module,
      'Reference No': d.referenceNo,
      Party: d.party,
      Description: d.description,
      'Invoice Amount': `₹${d.invoiceAmount.toLocaleString('en-IN')}`,
      'Received Amount': `₹${d.receivedAmount.toLocaleString('en-IN')}`,
      Discrepancy: d.discrepancyType === 'NONE' ? '-' : `₹${d.discrepancy.toLocaleString('en-IN')} (${d.discrepancyType})`,
      Status: d.status,
      'Payment Count': d.paymentCount,
      'Last Payment Date': d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString('en-IN') : 'N/A'
    }));

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToExcel(exportData, 'Payment_Reconciliation_Report', filters);
    toast.success('Exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredData.map(d => ({
      Date: new Date(d.date).toLocaleDateString('en-IN'),
      Module: d.module,
      'Ref No': d.referenceNo,
      Party: d.party,
      'Invoice Amt': `₹${d.invoiceAmount.toLocaleString('en-IN')}`,
      'Received Amt': `₹${d.receivedAmount.toLocaleString('en-IN')}`,
      Status: d.status
    }));

    const summary = {
      'Total Invoices': metrics.totalInvoices,
      'Matched': metrics.matchedInvoices,
      'Unmatched': metrics.unmatchedInvoices,
      'Partial': metrics.partiallyMatchedInvoices,
      'Invoice Amount': `₹${metrics.totalInvoiceAmount.toLocaleString('en-IN')}`,
      'Received Amount': `₹${metrics.totalReceivedAmount.toLocaleString('en-IN')}`,
      'Total Discrepancy': `₹${metrics.totalDiscrepancy.toLocaleString('en-IN')}`
    };

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToPDF('Payment Reconciliation Report', exportData, summary, filters);
    toast.success('Exported to PDF successfully');
  };

  const getStatusBadge = (status) => {
    const styles = {
      MATCHED: 'bg-green-100 text-green-700 border-green-200',
      UNMATCHED: 'bg-red-100 text-red-700 border-red-200',
      PARTIAL: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };

    const icons = {
      MATCHED: CheckCircle,
      UNMATCHED: XCircle,
      PARTIAL: AlertTriangle
    };

    const Icon = icons[status];

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{status}</span>
      </div>
    );
  };

  const getDiscrepancyBadge = (discrepancyType, amount) => {
    if (discrepancyType === 'NONE') {
      return <span className="text-gray-400 text-sm">-</span>;
    }

    const color = discrepancyType === 'UNDERPAID' ? 'text-red-600' : 'text-orange-600';
    return (
      <div className={`font-semibold ${color}`}>
        ₹{amount.toLocaleString('en-IN')}
        <div className="text-xs font-normal">{discrepancyType}</div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-soft">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Reconciliation</h1>
            <p className="text-sm text-gray-600">Match invoices with received payments</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{metrics.totalInvoices}</p>
          <p className="text-xs text-blue-700 mt-1">Total Invoices</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
              Matched
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900">{metrics.matchedInvoices}</p>
          <p className="text-xs text-green-700 mt-1">Fully Reconciled</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
              Partial
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{metrics.partiallyMatchedInvoices}</p>
          <p className="text-xs text-yellow-700 mt-1">Partially Matched</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200"
        >
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">
              Unmatched
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900">{metrics.unmatchedInvoices}</p>
          <p className="text-xs text-red-700 mt-1">No Payments</p>
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
          </select>

          {/* Status Filter */}
          <select
            value={reconciliationStatus}
            onChange={(e) => setReconciliationStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="MATCHED">Matched</option>
            <option value="PARTIAL">Partial</option>
            <option value="UNMATCHED">Unmatched</option>
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by party or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportToExcel}
              disabled={loading || filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-5 h-5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
          <p className="text-sm text-gray-600 mb-1">Total Invoice Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{metrics.totalInvoiceAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
          <p className="text-sm text-gray-600 mb-1">Total Received Amount</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{metrics.totalReceivedAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
          <p className="text-sm text-gray-600 mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-600">
            ₹{metrics.totalDiscrepancy.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reconciliation data found</p>
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Received Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Discrepancy</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900">{record.module}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {record.referenceNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{record.party}</div>
                      <div className="text-xs text-gray-500">{record.description}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ₹{record.invoiceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      ₹{record.receivedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {getDiscrepancyBadge(record.discrepancyType, record.discrepancy)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-900">{record.paymentCount}</span>
                        {record.lastPaymentDate && (
                          <span className="text-xs text-gray-500">
                            Last: {new Date(record.lastPaymentDate).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReconciliation;
