import { Search, X } from 'lucide-react';

// Search box for CashewFlowX customers (matches name or mobile number on the server).
const CashewFlowXCustomerSearch = ({ value, onChange }) => (
  <div className="relative flex-1">
    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      className="input-field pl-10 pr-9"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by customer name or mobile number..."
      aria-label="Search CashewFlowX customers"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
        aria-label="Clear search"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

export default CashewFlowXCustomerSearch;
