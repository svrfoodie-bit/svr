import { MessageCircle, RotateCw } from 'lucide-react';

const STATUS_BADGE = { Sent: 'badge-success', Failed: 'badge-danger', Skipped: 'badge-warning' };
const EVENT_LABEL = { STOCK_GIVEN: 'Stock Given', PAYMENT_RECEIVED: 'Payment Received', TEST: 'Test' };

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// WhatsApp messages for one CashewFlowX customer, newest first, with Resend for
// anything not delivered to Meta (Failed / Skipped).
const CashewFlowXWhatsAppHistory = ({ messages = [], onResend, resendingId }) => {
  if (messages.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="font-medium">No WhatsApp messages yet</p>
        <p className="text-sm">Messages appear here when stock or payments are saved with WhatsApp turned on.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Message</th>
            <th className="px-3 py-2">To</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {messages.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50 align-top">
              <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900">{EVENT_LABEL[m.eventType] || m.eventType}</div>
                <div className="text-xs text-gray-500">
                  {m.templateName || '-'}{m.languageCode ? ` · ${m.languageCode === 'te' ? 'Telugu' : 'English'}` : ''}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-700">{m.toNumber ? `+${m.toNumber}` : '-'}</td>
              <td className="px-3 py-2">
                <span className={`badge ${STATUS_BADGE[m.status] || 'badge-info'}`}>{m.status}</span>
                {m.errorMessage && <div className="text-xs text-red-600 mt-1 max-w-[280px] break-words">{m.errorMessage}</div>}
              </td>
              <td className="px-3 py-2 text-right">
                {m.status !== 'Sent' && (
                  <button
                    onClick={() => onResend(m)}
                    disabled={resendingId === m.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-green-700 border border-green-200 hover:bg-green-50 disabled:opacity-50"
                  >
                    <RotateCw size={14} className={resendingId === m.id ? 'animate-spin' : ''} />
                    {resendingId === m.id ? 'Sending...' : 'Resend'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashewFlowXWhatsAppHistory;
