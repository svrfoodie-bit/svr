import { Activity } from 'lucide-react';
import { formatCashewFlowXCurrency, formatCashewFlowXDate } from './cashewFlowXFormat';

// Unified history of stock given (+) and payments received (−), newest first,
// with the customer's running balance after each activity (negative = advance).
const CashewFlowXActivityHistory = ({ activity = [], limit }) => {
  const rows = limit ? activity.slice(0, limit) : activity;

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="font-medium">No activity yet</p>
      </div>
    );
  }

  const formatBalance = (value) =>
    value < 0 ? `${formatCashewFlowXCurrency(-value)} advance` : formatCashewFlowXCurrency(value);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Activity</th>
            <th className="px-3 py-2">Details</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((a) => {
            const isStock = a.activityType === 'STOCK_GIVEN';
            return (
              <tr key={a.activityKey} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{formatCashewFlowXDate(a.date)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`badge ${isStock ? 'badge-warning' : 'badge-success'}`}>{a.activityLabel}</span>
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {a.details}
                  {a.notes && <span className="block text-xs text-gray-400">{a.notes}</span>}
                </td>
                <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${isStock ? 'text-gray-900' : 'text-emerald-700'}`}>
                  {isStock ? '+' : '−'}{formatCashewFlowXCurrency(Math.abs(a.amount))}
                </td>
                <td className={`px-3 py-2 text-right whitespace-nowrap ${a.runningBalance < 0 ? 'text-blue-700' : 'text-gray-600'}`}>
                  {formatBalance(a.runningBalance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CashewFlowXActivityHistory;
