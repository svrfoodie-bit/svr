import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CashewFlowXPaymentEntryForm from '../../components/cashewFlowX/CashewFlowXPaymentEntryForm';

// Standalone "Add Payment" screen: pick a customer, record payment, then open that customer.
const CashewFlowXPaymentEntryPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetCustomerId = params.get('customerId');

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 mt-1" title="Back"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Add Payment Received</h1>
          <p className="text-sm text-gray-600 mt-1">CashewFlowX — payments reduce the customer’s outstanding balance</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
        <CashewFlowXPaymentEntryForm
          customerId={presetCustomerId || undefined}
          onSaved={(entry) => navigate(`/cashew-flow-x/customer/${entry.customerId}`)}
          onCancel={() => navigate('/cashew-flow-x')}
        />
      </div>
    </div>
  );
};

export default CashewFlowXPaymentEntryPage;
