import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { gstService } from '../services/gstService';

const PrintInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const result = await gstService.getInvoice(id);
      setData(result);
    } catch {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Invoice not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const { order, payments, gst, invoiceTotal, business } = data;
  const paidAmount = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const outstanding = invoiceTotal - paidAmount;
  const invoiceNumber = order.salesOrderId || `INV-${String(order.id).padStart(4, '0')}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Action Bar - hidden on print */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Invoice {invoiceNumber}</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Printer size={16} /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-3xl mx-auto my-6 print:my-0 print:max-w-none" ref={printRef}>
        <div className="bg-white shadow-lg print:shadow-none p-8 print:p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.address && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{business.address}</p>}
              <p className="text-sm text-gray-500 mt-1">FSSAI / GST Registered Business</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary-700">TAX INVOICE</h2>
              <p className="text-lg font-semibold text-gray-900 mt-1">{invoiceNumber}</p>
              <p className="text-sm text-gray-600">Date: {invoiceDate}</p>
              {order.deliveryDate && (
                <p className="text-sm text-gray-600">Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
              {order.customerPhone && <p className="text-sm text-gray-600">Phone: {order.customerPhone}</p>}
              {order.customerEmail && <p className="text-sm text-gray-600">Email: {order.customerEmail}</p>}
              {order.customerAddress && <p className="text-sm text-gray-600 mt-1">{order.customerAddress}</p>}
              <p className="text-xs text-gray-500 mt-1">{order.customerType} Customer</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Invoice Details</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice No.</span>
                  <span className="font-semibold">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold">{invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${order.status === 'Delivered' ? 'text-green-700' : 'text-orange-600'}`}>{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HSN Code</span>
                  <span className="font-semibold">0801</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">HSN</th>
                <th className="px-4 py-3 text-right">Qty (kg)</th>
                <th className="px-4 py-3 text-right">Rate/kg (₹)</th>
                <th className="px-4 py-3 text-right">Taxable Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-4">1</td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-gray-900">Cashew Kernel</p>
                  {order.productGrade && (
                    <p className="text-xs text-gray-500">Grade: {order.productGrade}</p>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-600">0801</td>
                <td className="px-4 py-4 text-right">{parseFloat(order.quantity).toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 text-right">₹{parseFloat(order.ratePerUnit).toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 text-right font-semibold">₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Taxable Value</span>
                <span className="font-medium">₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">CGST @ 2.5%</span>
                <span className="font-medium">₹{gst.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">SGST @ 2.5%</span>
                <span className="font-medium">₹{gst.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-900 text-base font-bold">
                <span>Total Invoice Value</span>
                <span className="text-primary-700">₹{invoiceTotal.toLocaleString('en-IN')}</span>
              </div>
              {paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-1 text-green-700">
                    <span>Amount Received</span>
                    <span className="font-medium">- ₹{paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-t border-gray-200 font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    <span>{outstanding > 0 ? 'Balance Due' : 'Fully Paid'}</span>
                    <span>₹{Math.abs(outstanding).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Amount in Words */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Invoice Amount (In Words)</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              ₹{invoiceTotal.toLocaleString('en-IN')} only
            </p>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Payment History</p>
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead><tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Mode</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reference</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-gray-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-2">{p.paymentMode}</td>
                      <td className="px-4 py-2 text-gray-500">{p.reference || '—'}</td>
                      <td className="px-4 py-2 text-right font-medium text-green-700">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">Terms & Conditions</p>
              <p className="text-xs text-gray-400 mt-1">• Goods once sold will not be taken back.</p>
              <p className="text-xs text-gray-400">• Subject to local jurisdiction.</p>
              <p className="text-xs text-gray-400">• E. & O.E.</p>
            </div>
            <div className="text-right">
              <div className="w-40 border-t border-gray-400 pt-2 mt-12">
                <p className="text-xs text-gray-600 font-medium">Authorised Signature</p>
                <p className="text-xs text-gray-500">{business.name}</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">— This is a computer generated invoice —</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 10mm; size: A4; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-6 { padding: 1.5rem !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:my-0 { margin-top: 0 !important; margin-bottom: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintInvoice;
