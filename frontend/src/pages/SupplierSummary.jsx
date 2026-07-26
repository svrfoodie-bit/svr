import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, DollarSign, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { rawPurchaseService } from '../services/rawPurchaseService';

const SupplierSummary = () => {
  const navigate = useNavigate();
  const [supplierSummary, setSupplierSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalSuppliers: 0,
    totalQuantity: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });

  useEffect(() => {
    loadSupplierSummary();
  }, []);

  const loadSupplierSummary = async () => {
    setLoading(true);
    try {
      const data = await rawPurchaseService.getSupplierSummary();
      setSupplierSummary(data);

      // Calculate totals
      const calculatedTotals = data.reduce((acc, supplier) => ({
        totalSuppliers: acc.totalSuppliers + 1,
        totalQuantity: acc.totalQuantity + supplier.totalQuantity,
        totalAmount: acc.totalAmount + supplier.totalAmount,
        totalPaid: acc.totalPaid + supplier.totalPaid,
        totalOutstanding: acc.totalOutstanding + supplier.totalOutstanding,
      }), {
        totalSuppliers: 0,
        totalQuantity: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
      });

      setTotals(calculatedTotals);
    } catch (error) {
      toast.error('Failed to load supplier summary');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Paid'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Supplier (RAW) Summary</h1>
        <p className="text-sm text-gray-600 mt-1">Raw supplier purchase and payment summary</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total RAW Suppliers</p>
              <p className="text-xl font-bold text-gray-900">{totals.totalSuppliers}</p>
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
              <p className="text-xs text-gray-600">Total Quantity</p>
              <p className="text-xl font-bold text-gray-900">{totals.totalQuantity} KG</p>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">₹{totals.totalAmount.toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">₹{totals.totalPaid.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">₹{totals.totalOutstanding.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Supplier Summary Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Supplier (RAW) Name
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Quantity
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Purchase Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Outstanding
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : supplierSummary.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No raw supplier data available
                  </td>
                </tr>
              ) : (
                supplierSummary.map((supplier, index) => (
                  <motion.tr
                    key={supplier.supplierId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {supplier.supplierName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{supplier.supplierName}</p>
                          <p className="text-xs text-gray-500">Supplier (RAW) ID: #{supplier.supplierId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-900">{supplier.totalQuantity} KG</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{supplier.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-green-600">
                        ₹{supplier.totalPaid.toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-red-600">
                        ₹{supplier.totalOutstanding.toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(
                          supplier.status
                        )}`}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/raw-purchases?supplierId=${supplier.supplierId}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Open raw purchases to add or edit payments"
                      >
                        <ExternalLink size={13} />
                        Purchases
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>

            {/* Table Footer - Grand Total */}
            {!loading && supplierSummary.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-bold">
                  <td className="px-6 py-4 text-gray-900">GRAND TOTAL</td>
                  <td className="px-6 py-4 text-right text-gray-900">{totals.totalQuantity} KG</td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    ₹{totals.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-right text-green-600">
                    ₹{totals.totalPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600">
                    ₹{totals.totalOutstanding.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Note:</p>
            <p className="text-sm text-blue-700">
              This is a read-only summary automatically calculated from raw purchase records.
              Data is aggregated by raw supplier and shows total purchases, payments, and outstanding balances.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupplierSummary;
