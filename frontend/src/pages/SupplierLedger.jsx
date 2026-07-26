import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Truck, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { ledgerService } from '../services/ledgerService';
import { get } from '../services/apiHelpers';

const SupplierLedger = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOutstanding();
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await get('/suppliers');
      setSuppliers(data);
    } catch {}
  };

  const loadOutstanding = async () => {
    setListLoading(true);
    try {
      const data = await ledgerService.getAllSuppliersOutstanding();
      setOutstanding(data);
    } catch {
      toast.error('Failed to load outstanding');
    } finally {
      setListLoading(false);
    }
  };

  const loadLedger = async (supplierId) => {
    setLoading(true);
    try {
      const filters = {};
      if (startDate && endDate) { filters.startDate = startDate; filters.endDate = endDate; }
      const data = await ledgerService.getSupplierLedger(supplierId, filters);
      setLedger(data);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const selectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    loadLedger(supplier.id);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Supplier (RAW) Ledger</h1>
        <p className="text-sm text-gray-600 mt-1">Full account statement — purchases & payments with running balance</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Supplier List */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search raw supplier..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600">SELECT SUPPLIER (RAW)</p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {filteredSuppliers.map(s => {
                const outs = outstanding.find(o => o.id === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => selectSupplier(s)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedSupplier?.id === s.id ? 'bg-primary-50 border-l-2 border-primary-600' : ''}`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{s.phone || 'No phone'}</p>
                      {outs && parseFloat(outs.outstanding) > 0 && (
                        <span className="text-xs font-semibold text-orange-600">
                          ₹{parseFloat(outs.outstanding).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">No raw suppliers found</div>
              )}
            </div>
          </div>

          {outstanding.length > 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-800 mb-2">PAYABLE SUMMARY</p>
              <p className="text-xl font-bold text-orange-700">
                ₹{outstanding.reduce((s, r) => s + parseFloat(r.outstanding), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-orange-600 mt-1">{outstanding.length} raw suppliers with dues</p>
            </div>
          )}
        </div>

        {/* Right: Ledger */}
        <div className="flex-1">
          {!selectedSupplier ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Truck size={56} className="mb-4 opacity-30" />
              <p className="font-medium text-lg">Select a raw supplier</p>
              <p className="text-sm mt-1">Click any raw supplier on the left to view their account statement</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedSupplier.name}</h2>
                  <p className="text-sm text-gray-500">{selectedSupplier.phone || 'No phone'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                  <button
                    onClick={() => loadLedger(selectedSupplier.id)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 transition-colors"
                  >Apply</button>
                </div>
              </div>

              {ledger && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-xs text-orange-700 font-medium">Total Purchases</p>
                    <p className="text-xl font-bold text-orange-800">₹{parseFloat(ledger.summary.totalPurchases).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-700 font-medium">Payments Made</p>
                    <p className="text-xl font-bold text-green-800">₹{parseFloat(ledger.summary.totalPayments).toLocaleString('en-IN')}</p>
                  </div>
                  <div className={`${parseFloat(ledger.summary.outstandingBalance) > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                    <p className={`text-xs font-medium ${parseFloat(ledger.summary.outstandingBalance) > 0 ? 'text-red-700' : 'text-gray-700'}`}>Payable</p>
                    <p className={`text-xl font-bold ${parseFloat(ledger.summary.outstandingBalance) > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                      ₹{parseFloat(ledger.summary.outstandingBalance).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ledger?.ledger?.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Purchase (₹)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Payment (₹)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ledger?.ledger?.map((row, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.txDate).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${row.txType === 'Purchase' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                {row.txType === 'Purchase' ? <ArrowUpCircle size={11} /> : <ArrowDownCircle size={11} />}
                                {row.txType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.description}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-orange-700">
                              {parseFloat(row.debit) > 0 ? `₹${parseFloat(row.debit).toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-green-700">
                              {parseFloat(row.credit) > 0 ? `₹${parseFloat(row.credit).toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className={`px-4 py-3 text-right text-sm font-bold ${row.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                              ₹{Math.abs(row.balance).toLocaleString('en-IN')}
                              {row.balance > 0 ? ' Payable' : row.balance < 0 ? ' Advance' : ''}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierLedger;
