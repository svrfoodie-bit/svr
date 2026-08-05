/**
 * Centralized StatusBadge component.
 * Handles payment statuses, active/inactive, customer types, cashew types, etc.
 *
 * Usage:
 *   <StatusBadge status="Paid" />
 *   <StatusBadge status="Active" />
 *   <StatusBadge status="Premium" />
 *   <StatusBadge status={customer.isActive ? 'Active' : 'Inactive'} />
 */

const VARIANT_MAP = {
  // Payment statuses
  paid:       'bg-green-100 text-green-700 border-green-200',
  partial:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending:    'bg-red-100 text-red-700 border-red-200',
  unpaid:     'bg-red-100 text-red-700 border-red-200',
  overdue:    'bg-red-100 text-red-700 border-red-200',

  // Active / Inactive
  active:     'bg-green-100 text-green-700 border-green-200',
  inactive:   'bg-gray-100 text-gray-600 border-gray-200',

  // Customer types
  retail:     'bg-blue-100 text-blue-700 border-blue-200',
  wholesale:  'bg-purple-100 text-purple-700 border-purple-200',

  // Cashew grades / quality
  premium:    'bg-purple-100 text-purple-700 border-purple-200',
  mid:        'bg-blue-100 text-blue-700 border-blue-200',
  low:        'bg-gray-100 text-gray-600 border-gray-200',
  standard:   'bg-gray-100 text-gray-600 border-gray-200',

  // Order / delivery status
  delivered:  'bg-green-100 text-green-700 border-green-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',

  // Job / task status
  completed:  'bg-green-100 text-green-700 border-green-200',
  inprogress: 'bg-blue-100 text-blue-700 border-blue-200',

  // Default fallback
  default:    'bg-gray-100 text-gray-600 border-gray-200',
};

const StatusBadge = ({ status, className = '' }) => {
  const key = String(status ?? '').toLowerCase().replace(/\s+/g, '');
  const classes = VARIANT_MAP[key] || VARIANT_MAP.default;

  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${classes} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
