import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, IndianRupee, BarChart3, AlertCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { gstService, GST_RATE, HSN_CODE } from '../services/gstService';
import { useCompanyStore } from '../context/companyStore';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const GSTReports = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [outputTax, setOutputTax] = useState([]);
  const [inputTax, setInputTax] = useState([]);
  const [hsnData, setHsnData] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, hsn] = await Promise.all([
        gstService.getGSTR3BSummary(month, year),
        gstService.getHSNSummary(month, year),
      ]);
      setSummary(s);
      setHsnData(hsn);
    } catch { toast.error('Failed to load GST data'); }
    finally { setLoading(false); }
  };

  const loadOutputTax = async () => {
    try {
      const data = await gstService.getOutputTax({ month, year });
      setOutputTax(data.transactions || []);
    } catch { toast.error('Failed to load output tax'); }
  };

  const loadInputTax = async () => {
    try {
      const data = await gstService.getInputTaxCredit({ month, year });
      setInputTax(data.transactions || []);
    } catch { toast.error('Failed to load input tax'); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'output' && outputTax.length === 0) loadOutputTax();
    if (tab === 'input' && inputTax.length === 0) loadInputTax();
  };

  const printReport = () => window.print();

  const tabs = [
    { key: 'summary', label: 'GSTR-3B Summary' },
    { key: 'output', label: 'Output Tax (Sales)' },
    { key: 'input', label: 'Input Tax Credit' },
    { key: 'hsn', label: 'HSN Summary' },
  ];

  return (
    <div className="p-4 md:p-6 print:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">GST Reports</h1>
          <p className="text-sm text-gray-600 mt-1">HSN 0801 — Cashew Nuts — {GST_RATE}% GST (CGST 2.5% + SGST 2.5%)</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 shadow-soft">
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 shadow-soft">
            {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={printReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-soft">
            <Download size={16} /> Print / Export
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">GST Report — {MONTHS[month-1]} {year}</h1>
        <p className="text-sm text-gray-600">{companyName} | HSN: {HSN_CODE} | GST Rate: {GST_RATE}%</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit print:hidden">
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* GSTR-3B SUMMARY */}
          {(activeTab === 'summary') && summary && (
            <div className="space-y-6">
              {/* Period Banner */}
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-primary-800">Filing Period: {MONTHS[month-1]} {year}</p>
                <p className="text-xs text-primary-600 mt-1">GSTR-3B Monthly Summary • HSN 0801 • {GST_RATE}% GST</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Output Tax */}
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                  className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Outward Supplies (Sales)</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-700">₹{parseFloat(summary.outwardSupplies.total).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-green-600 mt-1">Total Output GST</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-green-700">Taxable Value</span><span className="font-medium">₹{parseFloat(summary.outwardSupplies.taxableValue).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-green-700">CGST (2.5%)</span><span className="font-medium">₹{parseFloat(summary.outwardSupplies.cgst).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-green-700">SGST (2.5%)</span><span className="font-medium">₹{parseFloat(summary.outwardSupplies.sgst).toLocaleString('en-IN')}</span></div>
                  </div>
                </motion.div>

                {/* Input Tax Credit */}
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
                  className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Input Tax Credit (Purchases)</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">₹{parseFloat(summary.inputTaxCredit.total).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-blue-600 mt-1">Total ITC Available</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-blue-700">Taxable Value</span><span className="font-medium">₹{parseFloat(summary.inputTaxCredit.taxableValue).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-blue-700">CGST (2.5%)</span><span className="font-medium">₹{parseFloat(summary.inputTaxCredit.cgst).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-blue-700">SGST (2.5%)</span><span className="font-medium">₹{parseFloat(summary.inputTaxCredit.sgst).toLocaleString('en-IN')}</span></div>
                  </div>
                </motion.div>

                {/* Net Payable */}
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
                  className={`${summary.netPayable.isRefund ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'} border rounded-2xl p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <IndianRupee className={`w-5 h-5 ${summary.netPayable.isRefund ? 'text-purple-600' : 'text-orange-600'}`} />
                    <h3 className={`font-semibold ${summary.netPayable.isRefund ? 'text-purple-900' : 'text-orange-900'}`}>
                      {summary.netPayable.isRefund ? 'GST Refund' : 'Net GST Payable'}
                    </h3>
                  </div>
                  <p className={`text-3xl font-bold ${summary.netPayable.isRefund ? 'text-purple-700' : 'text-orange-700'}`}>
                    ₹{parseFloat(summary.netPayable.total).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-sm mt-1 ${summary.netPayable.isRefund ? 'text-purple-600' : 'text-orange-600'}`}>
                    {summary.netPayable.isRefund ? 'Refund Eligible' : 'To be Paid'}
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Net CGST</span><span className="font-medium">₹{parseFloat(summary.netPayable.cgst).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Net SGST</span><span className="font-medium">₹{parseFloat(summary.netPayable.sgst).toLocaleString('en-IN')}</span></div>
                  </div>
                </motion.div>
              </div>

              {/* Info Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Disclaimer:</span> These figures are auto-calculated based on recorded transactions. Cashew kernel (HSN 0801) attracts <strong>5% GST</strong> (2.5% CGST + 2.5% SGST). Verify with your CA before filing. Net Payable = Output Tax − Input Tax Credit.
                </p>
              </div>
            </div>
          )}

          {/* OUTPUT TAX TABLE */}
          {activeTab === 'output' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Output Tax — Sales Transactions</h3>
                <span className="text-sm text-gray-500">{outputTax.length} invoices</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Grade</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Qty (kg)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Taxable (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">CGST 2.5%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">SGST 2.5%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Invoice Value</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {outputTax.map((r, i) => (
                      <motion.tr key={r.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{new Date(r.invoiceDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 font-medium text-primary-700">{r.salesOrderId || `#${r.id}`}</td>
                        <td className="px-4 py-3 text-gray-900">{r.customerName}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{r.productGrade || '—'}</span></td>
                        <td className="px-4 py-3 text-right">{parseFloat(r.quantity).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{parseFloat(r.taxableValue).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-green-700">₹{parseFloat(r.cgst).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-green-700">₹{parseFloat(r.sgst).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{parseFloat(r.invoiceValue).toLocaleString('en-IN')}</td>
                      </motion.tr>
                    ))}
                    {outputTax.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No sales transactions for {MONTHS[month-1]} {year}</td></tr>}
                  </tbody>
                  {outputTax.length > 0 && (
                    <tfoot><tr className="bg-gray-50 font-semibold text-sm">
                      <td colSpan={5} className="px-4 py-3 text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right">₹{outputTax.reduce((s,r)=>s+parseFloat(r.taxableValue),0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-green-700">₹{outputTax.reduce((s,r)=>s+parseFloat(r.cgst),0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-green-700">₹{outputTax.reduce((s,r)=>s+parseFloat(r.sgst),0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">₹{outputTax.reduce((s,r)=>s+parseFloat(r.invoiceValue),0).toLocaleString('en-IN')}</td>
                    </tr></tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* INPUT TAX TABLE */}
          {activeTab === 'input' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Input Tax Credit — Purchase Transactions</h3>
                <span className="text-sm text-gray-500">{inputTax.length} purchases</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Grade</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Qty (kg)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Taxable (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">CGST 2.5%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">SGST 2.5%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total ITC</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {inputTax.map((r, i) => (
                      <motion.tr key={r.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{new Date(r.purchaseDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-900">{r.supplierName}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">{r.rawGrade || 'Standard'}</span></td>
                        <td className="px-4 py-3 text-right">{parseFloat(r.quantity).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{parseFloat(r.taxableValue).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-blue-700">₹{parseFloat(r.cgst).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-blue-700">₹{parseFloat(r.sgst).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">₹{parseFloat(r.totalGST).toLocaleString('en-IN')}</td>
                      </motion.tr>
                    ))}
                    {inputTax.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No purchase transactions for {MONTHS[month-1]} {year}</td></tr>}
                  </tbody>
                  {inputTax.length > 0 && (
                    <tfoot><tr className="bg-gray-50 font-semibold text-sm">
                      <td colSpan={4} className="px-4 py-3 text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right">₹{inputTax.reduce((s,r)=>s+parseFloat(r.taxableValue),0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-blue-700">₹{inputTax.reduce((s,r)=>s+parseFloat(r.cgst),0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-blue-700">₹{inputTax.reduce((s,r)=>s+parseFloat(r.sgst),0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-blue-700">₹{inputTax.reduce((s,r)=>s+parseFloat(r.totalGST),0).toLocaleString('en-IN')}</td>
                    </tr></tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* HSN SUMMARY */}
          {activeTab === 'hsn' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">HSN-wise Summary — {MONTHS[month-1]} {year}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">HSN Code</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600">GST Rate</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Total Qty (kg)</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Taxable Value (₹)</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">CGST (₹)</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">SGST (₹)</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Total Tax (₹)</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {hsnData.map((r, i) => (
                      <motion.tr key={i} initial={{opacity:0}} animate={{opacity:1}} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-bold text-primary-700">{r.hsnCode}</td>
                        <td className="px-5 py-4 text-gray-900">{r.description}</td>
                        <td className="px-5 py-4 text-center"><span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">{r.gstRate}%</span></td>
                        <td className="px-5 py-4 text-right">{parseFloat(r.totalQuantity || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right font-medium">₹{parseFloat(r.taxableValue || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right text-green-700">₹{parseFloat(r.cgst || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right text-green-700">₹{parseFloat(r.sgst || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4 text-right font-semibold">₹{parseFloat(r.totalTax || 0).toLocaleString('en-IN')}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
};

export default GSTReports;
