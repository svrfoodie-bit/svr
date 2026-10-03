import { Package, IndianRupee, Wallet, Scale } from 'lucide-react';
import { formatCashewFlowXCurrency, formatCashewFlowXKg } from './cashewFlowXFormat';

// Financial summary cards + cashew-type totals for one CashewFlowX customer.
const CashewFlowXCustomerSummary = ({ summary, typeTotals = [] }) => {
  if (!summary) return null;

  const balanceCard =
    summary.balanceStatus === 'Advance'
      ? { label: 'Advance Amount', value: summary.advanceAmount, tone: 'bg-blue-50 border-blue-200 text-blue-700', hint: 'Customer has paid more than the stock amount' }
      : summary.balanceStatus === 'Cleared'
        ? { label: 'Outstanding Balance', value: 0, tone: 'bg-green-50 border-green-200 text-green-700', hint: 'Fully cleared' }
        : { label: 'Outstanding Balance', value: summary.outstandingBalance, tone: 'bg-red-50 border-red-200 text-red-700', hint: 'Still to be received' };

  const cards = [
    { label: 'Total Stock', value: formatCashewFlowXKg(summary.totalStockKg), icon: Package, tone: 'bg-amber-50 border-amber-200 text-amber-700', hint: `${summary.stockEntryCount} stock entries` },
    { label: 'Total Stock Amount', value: formatCashewFlowXCurrency(summary.totalStockAmount), icon: IndianRupee, tone: 'bg-gray-50 border-gray-200 text-gray-800', hint: 'Sum of all stock given' },
    { label: 'Total Paid', value: formatCashewFlowXCurrency(summary.totalPaid), icon: Wallet, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700', hint: `${summary.paymentEntryCount} payments` },
    { label: balanceCard.label, value: formatCashewFlowXCurrency(balanceCard.value), icon: Scale, tone: balanceCard.tone, hint: balanceCard.hint },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, tone, hint }) => (
          <div key={label} className={`rounded-2xl border p-4 ${tone}`}>
            <div className="flex items-center gap-2 text-sm font-medium opacity-80">
              <Icon size={16} /> {label}
            </div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            <div className="text-xs mt-1 opacity-70">{hint}</div>
          </div>
        ))}
      </div>

      {typeTotals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock by Cashew Type</h3>
          <div className="divide-y divide-gray-100">
            {typeTotals.map((t) => (
              <div key={t.cashewTypeId} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-gray-800">{t.cashewTypeName}</span>
                <span className="text-gray-600">
                  {formatCashewFlowXKg(t.totalKg)} <span className="mx-2 text-gray-300">→</span>
                  <span className="font-semibold text-gray-900">{formatCashewFlowXCurrency(t.totalAmount)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashewFlowXCustomerSummary;
