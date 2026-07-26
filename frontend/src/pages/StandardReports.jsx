import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Package, Briefcase, Users, BarChart3, ShoppingCart,
  IndianRupee, Receipt, TrendingUp, ChevronDown, Calendar, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportService } from '../services/reportService';

const StandardReports = () => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    timeRange: 'MONTH',
  });

  const reportCategories = [
    {
      title: 'Purchases & Processing',
      reports: [
        { id: 'raw-purchase', label: 'Raw Purchase Summary', icon: Package, color: 'purple' },
        { id: 'job-work', label: 'Job Work Cost Report', icon: Briefcase, color: 'blue' },
        { id: 'worker-wage', label: 'Worker Wage & Bonus Report', icon: Users, color: 'orange' },
        { id: 'yield-wastage', label: 'Yield & Wastage Report', icon: BarChart3, color: 'green' },
      ]
    },
    {
      title: 'Sales & Finance',
      reports: [
        { id: 'sales', label: 'Sales Report', icon: ShoppingCart, color: 'green' },
        { id: 'customer-outstanding', label: 'Customer Outstanding Report', icon: IndianRupee, color: 'orange' },
        { id: 'expense-register', label: 'Expense Register', icon: Receipt, color: 'red' },
      ]
    },
    {
      title: 'Inventory',
      reports: [
        { id: 'raw-stock', label: 'Raw Stock Balance', icon: Package, color: 'purple' },
        { id: 'finished-stock', label: 'Finished Goods Stock', icon: TrendingUp, color: 'blue' },
      ]
    }
  ];

  const loadReport = async (reportId) => {
    setLoading(true);
    setActiveReport(reportId);
    setReportData(null);

    try {
      let data;
      const filterParams = filters.timeRange ? { timeRange: filters.timeRange } : {};

      switch (reportId) {
        case 'raw-purchase':
          data = await reportService.getRawPurchaseSummary(filterParams);
          break;
        case 'job-work':
          data = await reportService.getJobWorkCostReport(filterParams);
          break;
        case 'worker-wage':
          data = await reportService.getWorkerWageBonusReport(filterParams);
          break;
        case 'yield-wastage':
          data = await reportService.getYieldWastageReport(filterParams);
          break;
        case 'sales':
          data = await reportService.getSalesReport(filterParams);
          break;
        case 'customer-outstanding':
          data = await reportService.getCustomerOutstandingReport(filterParams);
          break;
        case 'expense-register':
          data = await reportService.getExpenseRegister(filterParams);
          break;
        case 'raw-stock':
          data = await reportService.getRawStockBalance();
          break;
        case 'finished-stock':
          data = await reportService.getFinishedGoodsStock();
          break;
        default:
          data = null;
      }

      setReportData(data);
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    const reportTitle = reportCategories.flatMap(c => c.reports).find(r => r.id === activeReport)?.label || 'Report';
    const contentEl = document.getElementById('report-print-area');
    if (!contentEl) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #555; margin-bottom: 20px; }
            .grid { display: grid; gap: 12px; margin-bottom: 16px; }
            .grid-4 { grid-template-columns: repeat(4, 1fr); }
            .grid-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-2 { grid-template-columns: repeat(2, 1fr); }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
            .card-label { font-size: 11px; color: #666; margin-bottom: 4px; }
            .card-value { font-size: 20px; font-weight: bold; }
            .section-title { font-size: 13px; font-weight: 600; color: #444; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; font-weight: 600; }
            td { border: 1px solid #ddd; padding: 8px; }
            .text-right { text-align: right; }
            .highlight-box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p class="subtitle">Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          ${contentEl.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (activeReport) {
      case 'raw-purchase':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Total Purchases</p>
                <p className="text-2xl font-bold text-purple-800">{reportData.totalPurchases}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Total Quantity</p>
                <p className="text-2xl font-bold text-blue-800">{reportData.totalQuantity.toFixed(2)} Kg</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-xs text-green-700 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-green-800">₹{reportData.totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <p className="text-xs text-orange-700 mb-1">Average Rate</p>
                <p className="text-2xl font-bold text-orange-800">₹{reportData.averageRate}/Kg</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-200 mb-4">
              <p className="text-sm text-gray-700">Outstanding Balance: <span className="font-bold text-red-600">₹{reportData.totalOutstanding.toLocaleString('en-IN')}</span></p>
            </div>
            {/* Payment Details */}
            {reportData.totalPaid > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-3">Payment Received Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600">Paid</p>
                    <p className="text-lg font-bold text-green-700">₹{reportData.totalPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-gray-600">Outstanding</p>
                    <p className="text-lg font-bold text-red-700">₹{reportData.totalOutstanding.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600">Collection %</p>
                    <p className="text-lg font-bold text-blue-700">
                      {((reportData.totalPaid / reportData.totalAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'job-work':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Total Job Works</p>
              <p className="text-2xl font-bold text-blue-800">{reportData.totalJobWorks}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">Total Quantity</p>
              <p className="text-2xl font-bold text-purple-800">{reportData.totalQuantity.toFixed(2)} Kg</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-700 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-green-800">₹{reportData.totalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        );

      case 'worker-wage':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <p className="text-xs text-orange-700 mb-1">Total Work Logs</p>
              <p className="text-2xl font-bold text-orange-800">{reportData.totalWorkLogs}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Total Wages</p>
              <p className="text-2xl font-bold text-blue-800">₹{reportData.totalWages.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">Total Bonus</p>
              <p className="text-2xl font-bold text-purple-800">₹{reportData.totalBonus.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-700 mb-1">Total Pay</p>
              <p className="text-2xl font-bold text-green-800">₹{reportData.totalPay.toLocaleString('en-IN')}</p>
            </div>
          </div>
        );

      case 'yield-wastage':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-700 mb-1">Total Batches</p>
                <p className="text-2xl font-bold text-gray-800">{reportData.totalBatches}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Raw Input</p>
                <p className="text-2xl font-bold text-purple-800">{reportData.totalRawInput.toFixed(2)} Kg</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-xs text-green-700 mb-1">Average Yield</p>
                <p className="text-2xl font-bold text-green-800">{reportData.averageYield}%</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-xs text-red-700 mb-1">Wastage</p>
                <p className="text-2xl font-bold text-red-800">{reportData.wastagePercent}%</p>
                <p className="text-xs text-red-600 mt-1">{reportData.totalWastage.toFixed(2)} Kg</p>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-blue-800">{reportData.totalOrders}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-xs text-green-700 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-green-800">₹{reportData.totalSales.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <p className="text-xs text-orange-700 mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-orange-800">₹{(reportData.totalOutstanding ?? 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            {/* Payment Collection Details */}
            {(reportData.totalReceived ?? 0) > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-3">Payment Collection Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600">Collected</p>
                    <p className="text-lg font-bold text-green-700">₹{(reportData.totalReceived ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-gray-600">Outstanding</p>
                    <p className="text-lg font-bold text-red-700">₹{(reportData.totalOutstanding ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600">Collection Rate</p>
                    <p className="text-lg font-bold text-blue-700">
                      {reportData.totalSales > 0 ? (((reportData.totalReceived ?? 0) / reportData.totalSales) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'customer-outstanding':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <p className="text-xs text-orange-700 mb-1">Customers with Outstanding</p>
                <p className="text-2xl font-bold text-orange-800">{reportData.totalCustomersWithOutstanding}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-xs text-red-700 mb-1">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-800">₹{reportData.totalOutstanding.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {reportData.data && reportData.data.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total Sales</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Paid</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.data.slice(0, 10).map((customer, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{customer.customerName}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">₹{customer.totalSales.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">₹{customer.totalPaid.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-red-600">₹{customer.totalOutstanding.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'expense-register':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-700 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-800">{reportData.totalExpenses}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-xs text-red-700 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-red-800">₹{reportData.totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {/* Payment Mode Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-3">Payment Mode Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-700 mb-1">💵 Cash</p>
                  <p className="text-lg font-bold text-green-800">₹{parseFloat(reportData.cashExpenses || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">📱 PhonePe</p>
                  <p className="text-lg font-bold text-blue-800">₹{parseFloat(reportData.phonePeExpenses || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-indigo-700 mb-1">🏦 Bank</p>
                  <p className="text-lg font-bold text-indigo-800">₹{parseFloat(reportData.bankExpenses || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'raw-stock':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Total Purchased</p>
              <p className="text-2xl font-bold text-blue-800">{reportData.totalPurchased} Kg</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <p className="text-xs text-orange-700 mb-1">Total Consumed</p>
              <p className="text-2xl font-bold text-orange-800">{reportData.totalConsumed} Kg</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-700 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-green-800">{reportData.currentBalance} Kg</p>
            </div>
          </div>
        );

      case 'finished-stock':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-blue-800">{reportData.totalProducts}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">Total Quantity</p>
              <p className="text-2xl font-bold text-purple-800">{reportData.totalQuantity.toFixed(2)} Kg</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-700 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-green-800">₹{reportData.totalValue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Standard Business Reports</h1>
        <p className="text-sm text-gray-600 mt-1">Generate comprehensive reports across all business operations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Report Filters</h3>
          </div>
          {activeReport && reportData && (
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-soft flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>
        </div>
      </div>

      {/* Report Categories */}
      {reportCategories.map((category, catIdx) => (
        <div key={catIdx} className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{category.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {category.reports.map((report, idx) => (
              <motion.button
                key={report.id}
                onClick={() => loadReport(report.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  activeReport === report.id
                    ? `border-${report.color}-500 bg-${report.color}-50`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <report.icon className={`w-6 h-6 text-${report.color}-600 mb-2`} />
                <p className="text-sm font-semibold text-gray-900">{report.label}</p>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      {/* Report Display */}
      <AnimatePresence>
        {activeReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {reportCategories.flatMap(c => c.reports).find(r => r.id === activeReport)?.label}
              </h3>
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              )}
            </div>

            {!loading && <div id="report-print-area">{renderReportContent()}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StandardReports;
