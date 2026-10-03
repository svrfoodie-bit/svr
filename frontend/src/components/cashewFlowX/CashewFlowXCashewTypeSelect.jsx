import { useEffect, useState } from 'react';
import { cashewFlowXCashewTypeService } from '../../services/cashewFlowXService';
import { notifyCashewFlowXError } from './cashewFlowXFormat';

// Cashew types always come from the CashewFlowXCashewType master — never hard-coded.
// Shows active types, plus the currently selected type even if it was later deactivated.
const CashewFlowXCashewTypeSelect = ({ value, onChange, error, disabled }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    cashewFlowXCashewTypeService.getAll(true)
      .then((rows) => { if (!cancelled) setTypes(rows || []); })
      .catch((err) => notifyCashewFlowXError(err, 'Failed to load cashew types'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const options = types.filter((t) => t.status === 'Active' || String(t.id) === String(value));

  return (
    <>
      <select
        className={`input-field ${error ? 'input-error' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{loading ? 'Loading types...' : 'Select cashew type'}</option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.cashewTypeName}{t.status !== 'Active' ? ' (inactive)' : ''}
          </option>
        ))}
      </select>
      {!loading && options.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">No active cashew types. Add one under CashewFlowX → Cashew Types.</p>
      )}
    </>
  );
};

export default CashewFlowXCashewTypeSelect;
