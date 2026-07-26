import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, IndianRupee, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesOrderService } from '../services/salesOrderService';

const OutstandingReport = () => {
  const navigate = useNavigate();
  const [outstandingOrders, setOutstandingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSummary, setCustomerSummary] = useState([]);

  useEffect(() => {
    loadOutstandingOrders();
    loadCustomerSummary();
  }, []);

  const loadOutstandingOrders = async () => {
    setLoading(true);
    try {
      const data = await salesOrderService.getOutstandingOrders();
      setOutstandingOrders(data);
    } catch (error) {
      toast.error('Failed to load outstanding orders');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerSummary = async () => {
    try {
      const data = await salesOrderService.getCustomerWiseSummary();
      // Filter only customers with outstanding
      const withOutstanding = data.filter(c => c.totalOutstanding > 0);
      setCustomerSummary(withOutstanding);
    } catch (error) {
    }
  };

  const getTotalOutstanding = () => {
    return outstandingOrders.reduce((sum, order) => sum + order.outstandingAmount, 0);
  };

  const getDaysOverdue = (orderDate) => {
    const today = new Date();
    const order = new Date(orderDate);
    const diffTime = today - order;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverdueColor = (days) => {
    if (days > 30) return 'text-red-600 font-bold';
    if (days > 15) return 'text-orange-600 font-semibold';
    if (days > 7) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Outstanding Report</h1>
        <p className="text-sm text-gray-600 mt-1">Track pending payments from customers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Outstanding</p>
              <p className="text-xl font-bold text-red-600">₹{getTotalOutstanding().toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending Orders</p>
              <p className="text-xl font-bold text-gray-900">{outstandingOrders.length}</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Customers with Dues</p>
              <p className="text-xl font-bold text-gray-900">{customerSummary.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Customer-wise Outstanding Summary */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Customer-wise Outstanding Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Orders</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerSummary.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No outstanding payments
                  </td>
                </tr>
              ) : (
                customerSummary.map((customer, index) => (
                  <motion.tr
                    key={customer.customerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{customer.customerName}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{customer.totalOrders}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₹{customer.totalSales.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      ₹{customer.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      ₹{customer.totalOutstanding.toLocaleString('en-IN')}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order-wise Outstanding Details */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Order-wise Outstanding Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Total</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Outstanding</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Days Overdue</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : outstandingOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No outstanding orders found
                  </td>
                </tr>
              ) : (
                outstandingOrders.map((order, index) => {
                  const daysOverdue = getDaysOverdue(order.date);
                  return (
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
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{order.orderTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">
                        ₹{order.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">
                        ₹{order.outstandingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${getOverdueColor(daysOverdue)}`}>
                          {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${
                          order.paymentStatus === 'Partial'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      {!loading && outstandingOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">Payment Follow-up Required:</p>
              <p className="text-sm text-orange-700">
                Orders highlighted in red are overdue by more than 30 days. Please follow up with customers for payment collection.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OutstandingReport;
