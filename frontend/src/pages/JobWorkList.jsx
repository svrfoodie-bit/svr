import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Edit, DollarSign, Package, TrendingDown, AlertCircle, FileDown, Printer } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { printJobWorkSlip } from '../utils/printUtils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jobWorkService } from '../services/jobWorkService';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import usePagination from '../hooks/usePagination';
import useSort from '../hooks/useSort';
import Pagination from '../components/ui/Pagination';
import SortHeader from '../components/ui/SortHeader';
import EmptyState from '../components/ui/EmptyState';

const JobWorkList = () => {
  const navigate = useNavigate();
  const [jobWorks, setJobWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeRange: 'MONTH',
    cashewType: '',
    paymentStatus: '',
  });
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    totalQuantitySent: 0,
    totalQuantityReceived: 0,
    totalLoss: 0,
    totalCost: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJobWork, setSelectedJobWork] = useState(null);
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
    loadJobWorks();
    loadMetrics();
  }, [filters]);

  const loadJobWorks = async () => {
    setLoading(true);
    try {
      const data = await jobWorkService.getAll(filters);
      setJobWorks(data);
    } catch (error) {
      toast.error('Failed to load job works');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await jobWorkService.getSummaryMetrics(filters);
      setMetrics(prev => ({
        ...prev,
        totalJobs: data.totalJobs ?? 0,
        totalQuantitySent: data.totalQuantitySent ?? 0,
        totalQuantityReceived: data.totalQuantityReceived ?? 0,
        totalLoss: data.totalLoss ?? 0,
        totalCost: data.totalCost ?? 0,
        totalPaid: data.totalPaid ?? 0,
        totalOutstanding: data.totalOutstanding ?? 0,
      }));
    } catch (error) {
    }
  };

  const { sortKey, sortDir, setSort, sorted: sortedJobs } = useSort(jobWorks, 'jobDate', 'desc');
  const { page, pageSize, setPage, paginated: pagedJobs, totalPages, total } = usePagination(sortedJobs, 25);

  const openPaymentModal = (jobWork) => {
    setSelectedJobWork(jobWork);
    setPaymentForm({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      paidAmount: jobWork.balance.toString(),
      transactionId: '',
      bankName: '',
      accountNumber: '',
      remarks: '',
    });
    setShowPaymentModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await jobWorkService.addPayment(selectedJobWork.id, {
        ...paymentForm,
        paidAmount: parseFloat(paymentForm.paidAmount),
      });
      toast.success('Payment added successfully');
      setShowPaymentModal(false);
      loadJobWorks();
      loadMetrics();
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Paid') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Partial') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getCashewTypeColor = (type) => {
    if (type === 'Premium') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (type === 'Mid') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleExportToExcel = () => {
    if (!jobWorks || jobWorks.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = jobWorks.map(job => ({
      'Date': new Date(job.jobDate).toLocaleDateString('en-IN'),
      'Job Worker': job.jobWorkerName,
      'Cashew Type': job.cashewType,
      'Quantity Sent (KG)': job.quantitySent,
      'Quantity Received (KG)': job.quantityReceived,
      'Loss (KG)': job.lossQuantity,
      'Total Cost': `₹${(job.totalCost ?? 0).toLocaleString('en-IN')}`,
      'Total Paid': `₹${(job.totalPaid ?? 0).toLocaleString('en-IN')}`,
      'Balance': `₹${(job.balance ?? 0).toLocaleString('en-IN')}`,
      'Payment Status': job.paymentStatus,
      'Remarks': job.remarks || ''
    }));

    exportToExcel(exportData, 'Job_Work_Report', { timeRange: filters.timeRange });
    toast.success('Report exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    if (!jobWorks || jobWorks.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = jobWorks.map(job => ({
      'Date': new Date(job.jobDate).toLocaleDateString('en-IN'),
      'Worker': job.jobWorkerName,
      'Type': job.cashewType,
      'Sent': `${job.quantitySent} KG`,
      'Received': `${job.quantityReceived} KG`,
      'Loss': `${job.lossQuantity} KG`,
      'Cost': `₹${(job.totalCost ?? 0).toLocaleString('en-IN')}`,
      'Paid': `₹${(job.totalPaid ?? 0).toLocaleString('en-IN')}`,
      'Balance': `₹${(job.balance ?? 0).toLocaleString('en-IN')}`,
      'Status': job.paymentStatus
    }));

    const summary = {
      'Total Jobs': metrics.totalJobs,
      'Total Quantity Sent': `${metrics.totalQuantitySent} KG`,
      'Total Quantity Received': `${metrics.totalQuantityReceived} KG`,
      'Total Loss': `${metrics.totalLoss} KG`,
      'Total Cost': `₹${(metrics.totalCost ?? 0).toLocaleString('en-IN')}`,
      'Total Paid': `₹${(metrics.totalPaid ?? 0).toLocaleString('en-IN')}`,
      'Total Outstanding': `₹${(metrics.totalOutstanding ?? 0).toLocaleString('en-IN')}`
    };

    exportToPDF('Job Work - Outside Steaming Report', exportData, summary, { timeRange: filters.timeRange });
    toast.success('PDF export opened in new window');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Work - Outside Steaming</h1>
          <p className="text-sm text-gray-600 mt-1">Track external steaming job works</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportToExcel}
            disabled={loading || jobWorks.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportToPDF}
            disabled={loading || jobWorks.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => navigate('/job-work/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Job Work</span>
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
              <Briefcase className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Jobs</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalJobs}</p>
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
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Quantity Received</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalQuantityReceived} KG</p>
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
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Loss</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalLoss} KG</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">₹{(metrics.totalOutstanding ?? 0).toLocaleString('en-IN')}</p>
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

          {/* Cashew Type Filter */}
          <select
            value={filters.cashewType}
            onChange={(e) => setFilters(prev => ({ ...prev, cashewType: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Cashew Types</option>
            <option value="Premium">Premium</option>
            <option value="Mid">Mid</option>
            <option value="Low">Low</option>
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

      {/* Job Works Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader col="jobDate" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="jobWorkerName" label="Job Worker" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="cashewType" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="quantitySent" label="Sent (KG)" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="quantityReceived" label="Received (KG)" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="lossQuantity" label="Loss (KG)" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Loss %</th>
                <SortHeader col="totalCost" label="Total Cost" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="totalPaid" label="Paid" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="balance" label="Balance" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader col="paymentStatus" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="center" />
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : jobWorks.length === 0 ? (
                <tr>
                  <td colSpan="12">
                    <EmptyState
                      icon={Briefcase}
                      message="No job works found"
                      subtext={filters.cashewType || filters.paymentStatus ? 'Try adjusting your filters.' : 'Record your first job work to get started.'}
                      action={!filters.cashewType && !filters.paymentStatus ? { label: '+ New Job Work', onClick: () => navigate('/job-work/new') } : null}
                    />
                  </td>
                </tr>
              ) : (
                pagedJobs.map((job, index) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(job.jobDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{job.jobWorkerName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.cashewType} />
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{job.quantitySent}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900 font-semibold">{job.quantityReceived}</td>
                    <td className="px-6 py-4 text-right text-sm text-red-600 font-semibold">{job.lossQuantity}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">
                      {(() => {
                        const pct = job.quantitySent > 0 ? (job.lossQuantity / job.quantitySent) * 100 : 0;
                        const cls = pct > 10 ? 'text-red-600' : pct > 5 ? 'text-yellow-600' : 'text-green-600';
                        return <span className={cls}>{pct.toFixed(1)}%</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₹{(job.totalCost ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      ₹{(job.totalPaid ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-red-600">
                      ₹{(job.balance ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={job.paymentStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {job.balance > 0 && (
                          <button
                            onClick={() => openPaymentModal(job)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Add Payment"
                          >
                            <DollarSign size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => printJobWorkSlip(job)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Print Slip"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/job-work/edit/${job.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Job Work"
                        >
                          <Edit size={18} />
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
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100 z-10">
                <h3 className="text-xl font-bold text-gray-900">Add Payment</h3>
              </div>

              <div className="px-6">
              {selectedJobWork && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600">Job Worker: <strong className="text-gray-900">{selectedJobWork.jobWorkerName}</strong></p>
                  <p className="text-sm text-gray-600 mt-1">Balance: <strong className="text-red-600">₹{(selectedJobWork.balance ?? 0).toLocaleString('en-IN')}</strong></p>
                </div>
              )}

              <form id="jobWorkPaymentForm" onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    <option value="Cash">Cash</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {(paymentForm.paymentMode === 'PhonePe' || paymentForm.paymentMode === 'Bank') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transaction ID / UPI Ref No<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentForm.transactionId}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="Enter transaction ID"
                      required
                    />
                  </div>
                )}

                {paymentForm.paymentMode === 'Bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bank Name<span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={paymentForm.bankName}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="Enter bank name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={paymentForm.accountNumber}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="Enter account number"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={paymentForm.paidAmount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                    step="0.01"
                    min="0"
                    max={selectedJobWork?.balance}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                    rows="2"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                    placeholder="Optional payment notes"
                  />
                </div>

              </form>
              </div>

              <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="jobWorkPaymentForm"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all"
                  >
                    Add Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobWorkList;
