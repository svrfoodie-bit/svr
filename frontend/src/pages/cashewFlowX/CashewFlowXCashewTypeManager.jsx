import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Edit2, Save, X, Trash2, Power, Tags } from 'lucide-react';
import { cashewFlowXCashewTypeService } from '../../services/cashewFlowXService';
import { notifyCashewFlowXError } from '../../components/cashewFlowX/cashewFlowXFormat';

// Manages the CashewFlowXCashewType master list used by stock entries.
const CashewFlowXCashewTypeManager = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setTypes((await cashewFlowXCashewTypeService.getAll(true)) || []);
    } catch (error) {
      setLoadError(true);
      notifyCashewFlowXError(error, 'Failed to load cashew types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTypes(); }, [loadTypes]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { setNewError('Cashew type name is required'); return; }
    setAdding(true);
    try {
      await cashewFlowXCashewTypeService.create({ cashewTypeName: newName.trim() });
      toast.success('Cashew type added');
      setNewName('');
      loadTypes();
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to add cashew type');
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (type) => {
    if (!editName.trim()) { toast.error('Cashew type name is required'); return; }
    setBusyId(type.id);
    try {
      await cashewFlowXCashewTypeService.update(type.id, { cashewTypeName: editName.trim(), status: type.status });
      toast.success('Cashew type updated');
      setEditingId(null);
      loadTypes();
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to update cashew type');
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (type) => {
    const next = type.status === 'Active' ? 'Inactive' : 'Active';
    const verb = next === 'Inactive' ? 'Deactivate' : 'Activate';
    const note = next === 'Inactive' ? '\n\nIt will no longer be offered for new stock entries; existing entries are kept.' : '';
    if (!window.confirm(`${verb} cashew type "${type.cashewTypeName}"?${note}`)) return;
    setBusyId(type.id);
    try {
      await cashewFlowXCashewTypeService.update(type.id, { cashewTypeName: type.cashewTypeName, status: next });
      toast.success(`Cashew type ${next === 'Inactive' ? 'deactivated' : 'activated'}`);
      loadTypes();
    } catch (error) {
      notifyCashewFlowXError(error, `Failed to ${verb.toLowerCase()} cashew type`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`Permanently delete cashew type "${type.cashewTypeName}"?`)) return;
    setBusyId(type.id);
    try {
      await cashewFlowXCashewTypeService.delete(type.id);
      toast.success('Cashew type deleted');
      loadTypes();
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to delete cashew type');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/cashew-flow-x')} className="p-2 rounded-xl hover:bg-gray-100 mt-1" title="Back to CashewFlowX">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CashewFlowX Cashew Types</h1>
          <p className="text-sm text-gray-600 mt-1">Types offered when recording stock given to customers</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4" noValidate>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Cashew Type</label>
        <div className="flex gap-2">
          <input
            className={`input-field ${newError ? 'input-error' : ''}`}
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNewError(''); }}
            placeholder="e.g. Split"
            maxLength={100}
          />
          <button type="submit" disabled={adding} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
            <Plus size={16} /> {adding ? 'Adding...' : 'Add Type'}
          </button>
        </div>
        {newError && <p className="text-xs text-red-600 mt-1">{newError}</p>}
      </form>

      <div className="bg-white rounded-2xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-600">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Loading cashew types...
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium">Could not load cashew types.</p>
            <button onClick={loadTypes} className="mt-3 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Retry</button>
          </div>
        ) : types.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Tags className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium">No cashew types yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {types.map((type) => (
              <li key={type.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === type.id ? (
                  <input
                    className="input-field flex-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(type); if (e.key === 'Escape') setEditingId(null); }}
                    maxLength={100}
                    autoFocus
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium ${type.status === 'Active' ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{type.cashewTypeName}</span>
                    <span className="ml-2 text-xs text-gray-500">{type.usageCount} stock entries</span>
                  </div>
                )}
                <span className={`badge ${type.status === 'Active' ? 'badge-success' : 'bg-gray-100 text-gray-600'}`}>{type.status}</span>
                <div className="flex gap-1">
                  {editingId === type.id ? (
                    <>
                      <button onClick={() => saveEdit(type)} disabled={busyId === type.id} className="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Save"><Save size={16} /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Cancel"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(type.id); setEditName(type.cashewTypeName); }} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Rename"><Edit2 size={16} /></button>
                      <button
                        onClick={() => toggleStatus(type)}
                        disabled={busyId === type.id}
                        className={`p-2 rounded-lg ${type.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={type.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(type)}
                        disabled={busyId === type.id || type.usageCount > 0}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={type.usageCount > 0 ? 'Used in stock entries — deactivate instead' : 'Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CashewFlowXCashewTypeManager;
