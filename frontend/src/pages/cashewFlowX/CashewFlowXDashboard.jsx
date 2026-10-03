import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Tags, Users, AlertTriangle, Wallet, PackagePlus, IndianRupee } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import { cashewFlowXCustomerService } from '../../services/cashewFlowXService';
import CashewFlowXCustomerSearch from '../../components/cashewFlowX/CashewFlowXCustomerSearch';
import CashewFlowXCustomerList from '../../components/cashewFlowX/CashewFlowXCustomerList';
import CashewFlowXCustomerForm from '../../components/cashewFlowX/CashewFlowXCustomerForm';
import { formatCashewFlowXCurrency, notifyCashewFlowXError } from '../../components/cashewFlowX/cashewFlowXFormat';

const CashewFlowXDashboard = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const rows = await cashewFlowXCustomerService.getAll({ search: debouncedSearch.trim(), status: statusFilter });
      setCustomers(rows || []);
    } catch (error) {
      setLoadError(true);
      notifyCashewFlowXError(error, 'Failed to load CashewFlowX customers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Totals of the listed customers (each customer's balance is calculated by the server).
  const totals = useMemo(() => customers.reduce((acc, c) => ({
    outstanding: acc.outstanding + c.outstandingBalance,
    advance: acc.advance + c.advanceAmount,
    stockAmount: acc.stockAmount + c.totalStockAmount,
  }), { outstanding: 0, advance: 0, stockAmount: 0 }), [customers]);

  const openCreate = () => { setEditingCustomer(null); setFormOpen(true); };
  const openEdit = (customer) => { setEditingCustomer(customer); setFormOpen(true); };

  const handleSaved = (saved) => {
    setFormOpen(false);
    if (!editingCustomer && saved?.id) navigate(`/cashew-flow-x/customer/${saved.id}`);
    else loadCustomers();
  };

  const handleToggleStatus = async (customer) => {
    const next = customer.status === 'Active' ? 'Inactive' : 'Active';
    const verb = next === 'Inactive' ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${verb} customer "${customer.customerName}"?`)) return;
    try {
      await cashewFlowXCustomerService.setStatus(customer.id, next);
      toast.success(`Customer ${next === 'Inactive' ? 'deactivated' : 'activated'}`);
      loadCustomers();
    } catch (error) {
      notifyCashewFlowXError(error, `Failed to ${verb.toLowerCase()} customer`);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Permanently delete customer "${customer.customerName}"?\n\nCustomers with stock or payment history cannot be deleted — deactivate them instead.`)) return;
    try {
      await cashewFlowXCustomerService.delete(customer.id);
      toast.success('Customer deleted');
      loadCustomers();
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to delete customer');
    }
  };

  const statCards = [
    { label: 'Customers', value: customers.length, icon: Users, tone: 'text-gray-800' },
    { label: 'Total Stock Amount', value: formatCashewFlowXCurrency(totals.stockAmount), icon: IndianRupee, tone: 'text-gray-800' },
    { label: 'Total Outstanding', value: formatCashewFlowXCurrency(totals.outstanding), icon: AlertTriangle, tone: 'text-red-700' },
    { label: 'Total Advance', value: formatCashewFlowXCurrency(totals.advance), icon: Wallet, tone: 'text-blue-700' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CashewFlowX</h1>
          <p className="text-sm text-gray-600 mt-1">Customer stock given, payments received and outstanding balances</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/cashew-flow-x/cashew-types')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
            <Tags size={16} /> Cashew Types
          </button>
          <button onClick={() => navigate('/cashew-flow-x/stock-entry')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
            <PackagePlus size={16} /> Add Stock
          </button>
          <button onClick={() => navigate('/cashew-flow-x/payment-entry')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
            <Wallet size={16} /> Add Payment
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500"><Icon size={16} /> {label}</div>
            <div className={`text-lg md:text-2xl font-bold mt-1 ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <CashewFlowXCustomerSearch value={search} onChange={setSearch} />
          <select className="input-field sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Customer status">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="">All</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-600">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Loading customers...
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium">Could not load customers.</p>
            <button onClick={loadCustomers} className="mt-3 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Retry</button>
          </div>
        ) : (
          <CashewFlowXCustomerList
            customers={customers}
            onView={(c) => navigate(`/cashew-flow-x/customer/${c.id}`)}
            onEdit={openEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            emptyMessage={search ? 'No customers match your search' : 'No customers yet — click “Add Customer” to start'}
          />
        )}
      </div>

      <CashewFlowXCustomerForm
        isOpen={formOpen}
        customer={editingCustomer}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default CashewFlowXDashboard;
