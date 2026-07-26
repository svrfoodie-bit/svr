import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, TrendingDown, TrendingUp, IndianRupee,
  Wallet, Plus, ArrowRight, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loanService, formatCurrency } from '../services/loanService';

const MetricCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'text-green-600' ? 'bg-green-50' : color === 'text-red-600' ? 'bg-red-50' : color === 'text-blue-600' ? 'bg-blue-50' : 'bg-orange-50'}`}>
        <Icon size={20} className={color} />
      </div>
    </div>
  </motion.div>
);

const LoanDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const result = await loanService.getDashboard();
      setData(result);
    } catch {
      toast.error('Failed to load loan dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading loan dashboard...</span>
        </div>
      </div>
    );
  }

  const netPositive = data.netPosition >= 0;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Loans & Capital</h1>
          <p className="text-sm text-gray-600 mt-1">Track loans, repayments, and capital investments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/loans/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all text-sm"
          >
            <Plus size={16} /> Add Loan
          </button>
          <button
            onClick={() => navigate('/capital-investments/new')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all text-sm"
          >
            <Plus size={16} /> Add Capital
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard title="Bank Loans" value={formatCurrency(data.totalBankPrincipal)} subtitle="Total principal" icon={Building2} color="text-blue-600" delay={0} />
        <MetricCard title="Hand Loans" value={formatCurrency(data.totalHandPrincipal)} subtitle="Total principal" icon={Users} color="text-orange-600" delay={0.05} />
        <MetricCard title="Outstanding" value={formatCurrency(data.totalOutstanding)} subtitle="Remaining to pay" icon={TrendingDown} color="text-red-600" delay={0.1} />
        <MetricCard title="Interest Paid" value={formatCurrency(data.totalInterestPaid)} subtitle="All time" icon={IndianRupee} color="text-purple-600" delay={0.15} />
        <MetricCard title="Capital Invested" value={formatCurrency(data.totalCapital)} subtitle="Total invested" icon={Wallet} color="text-green-600" delay={0.2} />
        <MetricCard title="Monthly Interest" value={formatCurrency(data.totalMonthlyInterest)} subtitle="Current burden" icon={AlertCircle} color="text-red-600" delay={0.25} />
      </div>

      {/* Net Position Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl p-5 mb-6 border ${netPositive ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Net Capital Position</p>
            <div className="flex items-baseline gap-3 mt-1">
              <p className={`text-3xl font-bold ${netPositive ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(Math.abs(data.netPosition))}
              </p>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${netPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {netPositive ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Capital Invested ({formatCurrency(data.totalCapital)}) − Outstanding Loans ({formatCurrency(data.totalOutstanding)})
            </p>
          </div>
          {netPositive ? (
            <TrendingUp className="w-12 h-12 text-green-400" />
          ) : (
            <TrendingDown className="w-12 h-12 text-red-400" />
          )}
        </div>
      </motion.div>

      {/* Per-loan interest breakdown */}
      {data.interestBreakdown?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 mb-6"
        >
          <h2 className="text-base font-bold text-gray-900 mb-4">Monthly Interest Burden by Loan</h2>
          <div className="space-y-3">
            {data.interestBreakdown.map((loan) => (
              <div key={loan.loanId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${loan.loanType === 'Bank' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {loan.loanType}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{loan.lenderName}</p>
                    <p className="text-xs text-gray-500">{loan.loanCode} · Outstanding: {formatCurrency(loan.outstandingPrincipal)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(loan.monthlyInterest)}/mo</p>
                  <p className="text-xs text-gray-500">{loan.interestPaymentType}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'View All Loans', desc: 'Manage bank & hand loans', path: '/loans', color: 'border-blue-200 hover:border-blue-400' },
          { label: 'Record Payment', desc: 'Log EMI or interest payment', path: '/loan-repayments', color: 'border-green-200 hover:border-green-400' },
          { label: 'Capital Investments', desc: 'Track money invested', path: '/capital-investments', color: 'border-purple-200 hover:border-purple-400' },
        ].map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`flex items-center justify-between p-4 bg-white rounded-xl border-2 ${link.color} transition-all text-left`}
          >
            <div>
              <p className="text-sm font-bold text-gray-800">{link.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LoanDashboard;
