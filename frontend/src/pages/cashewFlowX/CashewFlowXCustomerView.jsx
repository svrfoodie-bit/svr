import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, Phone, MapPin, PackagePlus, Wallet } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import {
  cashewFlowXCustomerService,
  cashewFlowXStockEntryService,
  cashewFlowXPaymentEntryService,
} from '../../services/cashewFlowXService';
import CashewFlowXCustomerSummary from '../../components/cashewFlowX/CashewFlowXCustomerSummary';
import CashewFlowXStockEntryTable from '../../components/cashewFlowX/CashewFlowXStockEntryTable';
import CashewFlowXPaymentEntryTable from '../../components/cashewFlowX/CashewFlowXPaymentEntryTable';
import CashewFlowXActivityHistory from '../../components/cashewFlowX/CashewFlowXActivityHistory';
import CashewFlowXStockEntryForm from '../../components/cashewFlowX/CashewFlowXStockEntryForm';
import CashewFlowXPaymentEntryForm from '../../components/cashewFlowX/CashewFlowXPaymentEntryForm';
import CashewFlowXCustomerForm from '../../components/cashewFlowX/CashewFlowXCustomerForm';
import {
  CASHEW_FLOW_X_BALANCE_BADGE,
  formatCashewFlowXCurrency,
  formatCashewFlowXDate,
  formatCashewFlowXKg,
  notifyCashewFlowXError,
} from '../../components/cashewFlowX/cashewFlowXFormat';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'stock', label: 'Stock History' },
  { key: 'payments', label: 'Payments' },
  { key: 'activity', label: 'Activity' },
];

const CashewFlowXCustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  // modal: null | { type: 'stock' | 'payment' | 'customer', entry? }
  const [modal, setModal] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  // Every mutation re-fetches details, so summary, type totals and activity are
  // always recalculated from the stored records rather than patched locally.
  const loadDetails = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError('');
    try {
      setDetails(await cashewFlowXCustomerService.getDetails(id));
    } catch (error) {
      setLoadError(error?.response?.status === 404 ? 'Customer not found' : 'Could not load customer');
      notifyCashewFlowXError(error, 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  const closeModalAndRefresh = () => {
    setModal(null);
    loadDetails({ silent: true });
  };

  const deleteStock = async (entry) => {
    const msg = `Delete stock entry?\n\n${formatCashewFlowXDate(entry.givenDate)} · ${entry.cashewTypeName} · ${formatCashewFlowXKg(entry.quantityKg)} · ${formatCashewFlowXCurrency(entry.totalAmount)}`;
    if (!window.confirm(msg)) return;
    setDeletingKey(`stock-${entry.id}`);
    try {
      await cashewFlowXStockEntryService.delete(entry.id);
      toast.success('Stock entry deleted');
      await loadDetails({ silent: true });
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to delete stock entry');
    } finally {
      setDeletingKey(null);
    }
  };

  const deletePayment = async (entry) => {
    const msg = `Delete payment?\n\n${formatCashewFlowXDate(entry.paymentDate)} · ${formatCashewFlowXCurrency(entry.paymentAmount)} · ${entry.paymentMode}`;
    if (!window.confirm(msg)) return;
    setDeletingKey(`payment-${entry.id}`);
    try {
      await cashewFlowXPaymentEntryService.delete(entry.id);
      toast.success('Payment deleted');
      await loadDetails({ silent: true });
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to delete payment');
    } finally {
      setDeletingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px] gap-2 text-gray-600">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        Loading customer...
      </div>
    );
  }

  if (loadError || !details) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-medium">{loadError || 'Could not load customer'}</p>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => navigate('/cashew-flow-x')} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Back to customers</button>
          <button onClick={() => loadDetails()} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Retry</button>
        </div>
      </div>
    );
  }

  const { customer, summary, typeTotals, stockEntries, paymentEntries, activity } = details;
  const stockDeletingId = deletingKey?.startsWith('stock-') ? Number(deletingKey.slice(6)) : null;
  const paymentDeletingId = deletingKey?.startsWith('payment-') ? Number(deletingKey.slice(8)) : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* A. Customer information */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/cashew-flow-x')} className="p-2 rounded-xl hover:bg-gray-100 mt-1" title="Back to customers">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{customer.customerName}</h1>
              <span className={`badge ${CASHEW_FLOW_X_BALANCE_BADGE[summary.balanceStatus]}`}>{summary.balanceStatus}</span>
              {customer.status === 'Inactive' && <span className="badge bg-gray-100 text-gray-600">Inactive</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Phone size={14} /> {customer.mobileNumber || 'No mobile'}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {customer.address || 'No address'}</span>
            </div>
            {customer.notes && <p className="text-sm text-gray-500 mt-1">{customer.notes}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModal({ type: 'customer' })} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={() => setModal({ type: 'stock' })} className="btn-primary flex items-center gap-2 text-sm">
            <PackagePlus size={16} /> Add Stock
          </button>
          <button onClick={() => setModal({ type: 'payment' })} className="btn-success flex items-center gap-2 text-sm">
            <Wallet size={16} /> Add Payment
          </button>
        </div>
      </div>

      {/* B. Financial summary */}
      <CashewFlowXCustomerSummary summary={summary} typeTotals={activeTab === 'overview' ? typeTotals : []} />

      {/* C. History tabs */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
              {tab.key === 'stock' && ` (${stockEntries.length})`}
              {tab.key === 'payments' && ` (${paymentEntries.length})`}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 'overview' && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h3>
              <CashewFlowXActivityHistory activity={activity} limit={5} />
              {activity.length > 5 && (
                <button onClick={() => setActiveTab('activity')} className="mt-3 text-sm text-primary-600 hover:underline">
                  View all {activity.length} activities →
                </button>
              )}
            </>
          )}
          {activeTab === 'stock' && (
            <CashewFlowXStockEntryTable
              entries={stockEntries}
              onEdit={(entry) => setModal({ type: 'stock', entry })}
              onDelete={deleteStock}
              deletingId={stockDeletingId}
            />
          )}
          {activeTab === 'payments' && (
            <CashewFlowXPaymentEntryTable
              entries={paymentEntries}
              onEdit={(entry) => setModal({ type: 'payment', entry })}
              onDelete={deletePayment}
              deletingId={paymentDeletingId}
            />
          )}
          {activeTab === 'activity' && <CashewFlowXActivityHistory activity={activity} />}
        </div>
      </div>

      <Modal isOpen={modal?.type === 'stock'} onClose={() => setModal(null)} title={modal?.entry ? 'Edit Stock Entry' : 'Add Stock Given'}>
        {modal?.type === 'stock' && (
          <CashewFlowXStockEntryForm customerId={customer.id} entry={modal.entry} onSaved={closeModalAndRefresh} onCancel={() => setModal(null)} />
        )}
      </Modal>

      <Modal isOpen={modal?.type === 'payment'} onClose={() => setModal(null)} title={modal?.entry ? 'Edit Payment' : 'Add Payment Received'}>
        {modal?.type === 'payment' && (
          <CashewFlowXPaymentEntryForm
            customerId={customer.id}
            entry={modal.entry}
            outstandingBalance={summary.outstandingBalance}
            onSaved={closeModalAndRefresh}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <CashewFlowXCustomerForm
        isOpen={modal?.type === 'customer'}
        customer={customer}
        onClose={() => setModal(null)}
        onSaved={closeModalAndRefresh}
      />
    </div>
  );
};

export default CashewFlowXCustomerView;
