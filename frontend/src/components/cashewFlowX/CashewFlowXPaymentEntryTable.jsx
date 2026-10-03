import { Edit2, Trash2, Wallet } from 'lucide-react';
import { formatCashewFlowXCurrency, formatCashewFlowXDate } from './cashewFlowXFormat';

const CashewFlowXPaymentEntryTable = ({ entries = [], onEdit, onDelete, deletingId }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="font-medium">No payments received yet</p>
        <p className="text-sm">Use “+ Add Payment” to record a payment from this customer.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2">Mode</th>
            <th className="px-3 py-2">Reference</th>
            <th className="px-3 py-2">Notes</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">{formatCashewFlowXDate(p.paymentDate)}</td>
              <td className="px-3 py-2 text-right font-semibold text-emerald-700 whitespace-nowrap">{formatCashewFlowXCurrency(p.paymentAmount)}</td>
              <td className="px-3 py-2"><span className="badge badge-info">{p.paymentMode}</span></td>
              <td className="px-3 py-2 text-gray-600">{p.referenceNumber || '-'}</td>
              <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate" title={p.notes || ''}>{p.notes || '-'}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(p)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit payment">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(p)} disabled={deletingId === p.id} className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40" title="Delete payment">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashewFlowXPaymentEntryTable;
