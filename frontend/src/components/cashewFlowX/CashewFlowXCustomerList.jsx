import { Eye, Edit2, Trash2, Power, Users } from 'lucide-react';
import {
  CASHEW_FLOW_X_BALANCE_BADGE,
  formatCashewFlowXCurrency,
  formatCashewFlowXKg,
} from './cashewFlowXFormat';

const BalanceCell = ({ customer }) => {
  if (customer.balanceStatus === 'Advance') {
    return <span className="text-blue-700 font-semibold">{formatCashewFlowXCurrency(customer.advanceAmount)} adv.</span>;
  }
  return (
    <span className={customer.outstandingBalance > 0 ? 'text-red-700 font-semibold' : 'text-gray-500'}>
      {formatCashewFlowXCurrency(customer.outstandingBalance)}
    </span>
  );
};

const CashewFlowXCustomerList = ({ customers = [], onView, onEdit, onToggleStatus, onDelete, emptyMessage }) => {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="font-medium">{emptyMessage || 'No customers found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Mobile</th>
            <th className="px-3 py-2 text-right">Stock</th>
            <th className="px-3 py-2 text-right">Stock Amount</th>
            <th className="px-3 py-2 text-right">Paid</th>
            <th className="px-3 py-2 text-right">Balance</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onView(c)}>
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900">{c.customerName}</div>
                {c.address && <div className="text-xs text-gray-500 truncate max-w-[220px]">{c.address}</div>}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.mobileNumber || '-'}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">{formatCashewFlowXKg(c.totalStockKg)}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">{formatCashewFlowXCurrency(c.totalStockAmount)}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap text-emerald-700">{formatCashewFlowXCurrency(c.totalPaid)}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap"><BalanceCell customer={c} /></td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex flex-col gap-1 items-start">
                  <span className={`badge ${CASHEW_FLOW_X_BALANCE_BADGE[c.balanceStatus]}`}>{c.balanceStatus}</span>
                  {c.status === 'Inactive' && <span className="text-xs text-gray-400">Inactive</span>}
                </div>
              </td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1">
                  <button onClick={() => onView(c)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" title="View customer"><Eye size={16} /></button>
                  <button onClick={() => onEdit(c)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit customer"><Edit2 size={16} /></button>
                  <button
                    onClick={() => onToggleStatus(c)}
                    className={`p-2 rounded-lg ${c.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                    title={c.status === 'Active' ? 'Deactivate customer' : 'Activate customer'}
                  >
                    <Power size={16} />
                  </button>
                  <button onClick={() => onDelete(c)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Delete customer"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashewFlowXCustomerList;
