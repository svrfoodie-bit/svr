import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workerAdvanceService } from '../services/workerAdvanceService';
import { workerService } from '../services/workerService';

const WorkerAdvances = () => {
  const navigate = useNavigate();
  const [advances, setAdvances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [workerBalances, setWorkerBalances] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balances'); // balances, advances, settlements
  const [filters, setFilters] = useState({
    timeRange: 'MONTH',
    workerId: '',
  });
  const [metrics, setMetrics] = useState({
    totalAdvances: 0,
    totalSettlements: 0,
    totalOutstanding: 0,
    uniqueWorkers: 0,
  });

  // Modal States
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [advanceForm, setAdvanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    workerName: '',
    amount: '',
    paymentMode: 'Cash',
    transactionId: '', // For PhonePe/Bank
    bankName: '', // For Bank Transfer
    accountNumber: '', // For Bank Transfer
    remarks: '',
  });
  const [settlementForm, setSettlementForm] = useState({
    date: new Date().toISOString().split('T')[0],
    settledAmount: '',
    settledAgainst: '',
    remarks: '',
  });

  useEffect(() => {
    loadWorkers();
    loadData();
  }, [filters, activeTab]);

  const loadWorkers = async () => {
    try {
      const data = await workerService.getActive();
      setWorkers(data);
    } catch (error) {
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [advancesData, settlementsData, balancesData, metricsData] = await Promise.all([
        workerAdvanceService.getAllAdvances(filters),
        workerAdvanceService.getAllSettlements(filters),
        workerAdvanceService.getAllWorkerBalances(),
        workerAdvanceService.getSummaryMetrics(filters),
      ]);

      setAdvances(advancesData);
      setSettlements(settlementsData);
      setWorkerBalances(balancesData);
      setMetrics(metricsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAdvanceModal = () => {
    setAdvanceForm({
      date: new Date().toISOString().split('T')[0],
      workerId: '',
      workerName: '',
      amount: '',
      paymentMode: 'Cash',
      remarks: '',
    });
    setShowAdvanceModal(true);
  };

  const openSettlementModal = (worker) => {
    setSelectedWorker(worker);
    setSettlementForm({
      date: new Date().toISOString().split('T')[0],
      settledAmount: worker.balance.toString(),
      settledAgainst: 'Wages',
      remarks: '',
    });
    setShowSettlementModal(true);
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    try {
      await workerAdvanceService.createAdvance({
        ...advanceForm,
        workerId: parseInt(advanceForm.workerId),
        amount: parseFloat(advanceForm.amount),
      });
      toast.success('Advance recorded successfully');
      setShowAdvanceModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to record advance');
    }
  };

  const handleAddSettlement = async (e) => {
    e.preventDefault();
    try {
      await workerAdvanceService.createSettlement({
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.workerName,
        ...settlementForm,
        settledAmount: parseFloat(settlementForm.settledAmount),
      });
      toast.success('Settlement recorded successfully');
      setShowSettlementModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to record settlement');
    }
  };

  const handleAdvanceFormChange = (e) => {
    const { name, value } = e.target;
    setAdvanceForm(prev => ({ ...prev, [name]: value }));

    if (name === 'workerId') {
      const worker = workers.find(w => w.id === parseInt(value));
      if (worker) {
        setAdvanceForm(prev => ({ ...prev, workerName: worker.name }));
      }
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Worker Advances</h1>
          <p className="text-sm text-gray-600 mt-1">Track advances and settlements</p>
        </div>
        <button
          onClick={openAdvanceModal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
        >
          <Plus size={20} />
          <span>Give Advance</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Advances</p>
              <p className="text-xl font-bold text-gray-900">₹{metrics.totalAdvances.toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Settled</p>
              <p className="text-xl font-bold text-gray-900">₹{metrics.totalSettlements.toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">₹{metrics.totalOutstanding.toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Workers</p>
              <p className="text-xl font-bold text-gray-900">{workerBalances.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'balances'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Worker Balances
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'advances'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Advances
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'settlements'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settlements
          </button>
        </div>

        {/* Filters - only show for advances and settlements */}
        {(activeTab === 'advances' || activeTab === 'settlements') && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <select
                value={filters.workerId}
                onChange={(e) => setFilters(prev => ({ ...prev, workerId: e.target.value }))}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              >
                <option value="">All Workers</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {/* Worker Balances Tab */}
          {activeTab === 'balances' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Advanced</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Settled</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : workerBalances.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No advance records found
                      </td>
                    </tr>
                  ) : (
                    workerBalances.map((worker, index) => (
                      <motion.tr
                        key={worker.workerId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{worker.workerName}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          ₹{worker.totalAdvanced.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-green-600">
                          ₹{worker.totalSettled.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-yellow-600">
                          ₹{worker.balance.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {worker.balance > 0 && (
                            <button
                              onClick={() => openSettlementModal(worker)}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                            >
                              Settle
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Advances Tab */}
          {activeTab === 'advances' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Mode</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : advances.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No advances found</td>
                    </tr>
                  ) : (
                    advances.map((advance, index) => (
                      <motion.tr
                        key={advance.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(advance.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{advance.workerName}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                          ₹{advance.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{advance.paymentMode}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{advance.remarks || '-'}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Settlements Tab */}
          {activeTab === 'settlements' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Settled Against</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No settlements found</td>
                    </tr>
                  ) : (
                    settlements.map((settlement, index) => (
                      <motion.tr
                        key={settlement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(settlement.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{settlement.workerName}</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          ₹{settlement.settledAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{settlement.settledAgainst}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{settlement.remarks || '-'}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Advance Modal */}
      <AnimatePresence>
        {showAdvanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdvanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100 z-10">
                <h3 className="text-xl font-bold text-gray-900">Give Advance</h3>
              </div>

              <form id="advanceForm" onSubmit={handleAddAdvance} className="p-6 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={advanceForm.date}
                    onChange={handleAdvanceFormChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Worker</label>
                  <select
                    name="workerId"
                    value={advanceForm.workerId}
                    onChange={handleAdvanceFormChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    required
                  >
                    <option value="">Select Worker</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>{worker.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={advanceForm.amount}
                    onChange={handleAdvanceFormChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                  <select
                    name="paymentMode"
                    value={advanceForm.paymentMode}
                    onChange={handleAdvanceFormChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    <option value="Cash">Cash</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                {/* PhonePe/Bank Transaction ID */}
                {(advanceForm.paymentMode === 'PhonePe' || advanceForm.paymentMode === 'Bank') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {advanceForm.paymentMode === 'PhonePe' ? 'Transaction ID / UPI Ref No' : 'Transaction ID / Reference No'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={advanceForm.transactionId}
                      onChange={handleAdvanceFormChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder={advanceForm.paymentMode === 'PhonePe' ? 'Enter UPI Transaction ID' : 'Enter Bank Reference No'}
                      required
                    />
                  </div>
                )}

                {/* Bank Details */}
                {advanceForm.paymentMode === 'Bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bank Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={advanceForm.bankName}
                        onChange={handleAdvanceFormChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="Enter Bank Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Account Number (Last 4 digits)
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={advanceForm.accountNumber}
                        onChange={handleAdvanceFormChange}
                        maxLength="4"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="Last 4 digits"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                  <textarea
                    name="remarks"
                    value={advanceForm.remarks}
                    onChange={handleAdvanceFormChange}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                    placeholder="Reason for advance..."
                  />
                </div>

              </form>

              <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="advanceForm"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all"
                  >
                    Give Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdvanceModal(false)}
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

      {/* Settlement Modal */}
      <AnimatePresence>
        {showSettlementModal && selectedWorker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettlementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100 z-10">
                <h3 className="text-xl font-bold text-gray-900">Record Settlement</h3>
              </div>

              <div className="p-6 pt-4">
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600">Worker: <strong className="text-gray-900">{selectedWorker.workerName}</strong></p>
                  <p className="text-sm text-gray-600 mt-1">Outstanding Balance: <strong className="text-red-600">₹{selectedWorker.balance.toLocaleString('en-IN')}</strong></p>
                </div>
              </div>

              <form id="settlementForm" onSubmit={handleAddSettlement} className="px-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={settlementForm.date}
                    onChange={(e) => setSettlementForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Settled Amount</label>
                  <input
                    type="number"
                    value={settlementForm.settledAmount}
                    onChange={(e) => setSettlementForm(prev => ({ ...prev, settledAmount: e.target.value }))}
                    step="0.01"
                    min="0"
                    max={selectedWorker.balance}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Settled Against</label>
                  <input
                    type="text"
                    value={settlementForm.settledAgainst}
                    onChange={(e) => setSettlementForm(prev => ({ ...prev, settledAgainst: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="e.g., Wages for Week 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={settlementForm.remarks}
                    onChange={(e) => setSettlementForm(prev => ({ ...prev, remarks: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>

              </form>

              <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="settlementForm"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold transition-all"
                  >
                    Record Settlement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettlementModal(false)}
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

export default WorkerAdvances;
