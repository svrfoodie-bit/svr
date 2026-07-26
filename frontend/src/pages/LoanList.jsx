import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building2, Users, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loanService, formatCurrency } from '../services/loanService';

const LoanList = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ loanType: '', status: '' });

  useEffect(() => {
    load();
  }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await loanService.getAll(filters);
      setLoans(data);
    } catch {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, loanCode) => {
    if (!window.confirm(`Delete loan ${loanCode}? All payments will also be deleted.`)) return;
    try {
      await loanService.delete(id);
      toast.success('Loan deleted');
      load();
    } catch {
      toast.error('Failed to delete loan');
    }
  };

  const totalOutstanding = loans
    .filter((l) => l.status === 'Active')
    .reduce((s, l) => s + (parseFloat(l.outstandingBalance) || 0), 0);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-600 mt-1">Bank loans and hand loans</p>
        </div>
        <button
          onClick={() => navigate('/loans/new')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all text-sm"
        >
          <Plus size={16} /> Add Loan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filters.loanType}
          onChange={(e) => setFilters((p) => ({ ...p, loanType: e.target.value }))}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="">All Types</option>
          <option value="Bank">Bank</option>
          <option value="Hand">Hand Loan</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>
        {totalOutstanding > 0 && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">
              Total Outstanding: {formatCurrency(totalOutstanding)}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <IndianRupee size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No loans found</p>
          <p className="text-sm mt-1">Add your first loan to start tracking</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Type', 'Lender', 'Principal', 'Rate', 'Interest Payment', 'Outstanding', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loans.map((loan, i) => (
                  <motion.tr
                    key={loan.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{loan.loanCode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${loan.loanType === 'Bank' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {loan.loanType === 'Bank' ? <Building2 size={11} /> : <Users size={11} />}
                        {loan.loanType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{loan.lenderName}</p>
                      {loan.lenderPhone && <p className="text-xs text-gray-400">{loan.lenderPhone}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(loan.principalAmount)}</td>
                    <td className="px-4 py-3 text-gray-700">{loan.interestRate}% p.a.</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {loan.interestPaymentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${loan.status === 'Active' ? 'text-red-600' : 'text-gray-400'}`}>
                        {loan.status === 'Active' ? formatCurrency(loan.outstandingBalance) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${loan.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {loan.status === 'Active' ? <CheckCircle size={11} /> : null}
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/loans/edit/${loan.id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/loan-repayments?loanId=${loan.id}`)}
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors text-xs font-semibold px-2"
                          title="Payments"
                        >
                          Payments
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id, loan.loanCode)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanList;
