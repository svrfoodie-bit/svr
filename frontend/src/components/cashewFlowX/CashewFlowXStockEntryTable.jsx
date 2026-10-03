import { Edit2, Trash2, Package } from 'lucide-react';
import { formatCashewFlowXCurrency, formatCashewFlowXDate, formatCashewFlowXKg } from './cashewFlowXFormat';

const CashewFlowXStockEntryTable = ({ entries = [], onEdit, onDelete, deletingId }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="font-medium">No stock given yet</p>
        <p className="text-sm">Use “+ Add Stock” to record stock given to this customer.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Cashew Type</th>
            <th className="px-3 py-2 text-right">Quantity</th>
            <th className="px-3 py-2 text-right">Price/KG</th>
            <th className="px-3 py-2 text-right">Total Amount</th>
            <th className="px-3 py-2">Notes</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">{formatCashewFlowXDate(s.givenDate)}</td>
              <td className="px-3 py-2 font-medium text-gray-900">{s.cashewTypeName}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">{formatCashewFlowXKg(s.quantityKg)}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">{formatCashewFlowXCurrency(s.pricePerKg)}</td>
              <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">{formatCashewFlowXCurrency(s.totalAmount)}</td>
              <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate" title={s.notes || ''}>{s.notes || '-'}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(s)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit stock entry">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(s)} disabled={deletingId === s.id} className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40" title="Delete stock entry">
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

export default CashewFlowXStockEntryTable;
