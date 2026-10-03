import { useEffect, useState } from 'react';
import { cashewFlowXCustomerService } from '../../services/cashewFlowXService';
import { notifyCashewFlowXError } from './cashewFlowXFormat';

// Picks a CashewFlowX customer (used by the standalone stock/payment entry pages).
const CashewFlowXCustomerSelect = ({ value, onChange, error }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    cashewFlowXCustomerService.getAll({ status: 'Active' })
      .then((rows) => { if (!cancelled) setCustomers(rows || []); })
      .catch((err) => notifyCashewFlowXError(err, 'Failed to load customers'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <select
        className={`input-field ${error ? 'input-error' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading customers...' : 'Select customer'}</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.customerName}{c.mobileNumber ? ` (${c.mobileNumber})` : ''}
          </option>
        ))}
      </select>
      {!loading && customers.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">No active CashewFlowX customers yet. Add one first.</p>
      )}
    </>
  );
};

export default CashewFlowXCustomerSelect;
