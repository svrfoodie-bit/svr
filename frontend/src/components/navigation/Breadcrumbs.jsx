import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS = {
  'raw-purchases': 'Raw Purchases',
  'supplier-summary': 'Supplier (RAW) Summary',
  'vendors-payable': 'Supplier (RAW) Dues',
  'supplier-ledger': 'Supplier (RAW) Ledger',
  workers: 'Workers',
  'job-work': 'Job Work',
  'daily-work': 'Daily Work',
  'worker-advances': 'Worker Advances',
  batches: 'Production',
  yield: 'Output Entry',
  'finished-goods-stock': 'Finished Goods Stock',
  customers: 'Customers',
  'sales-orders': 'Sales Orders',
  'sales-payments': 'Sales Payments',
  'outstanding-report': 'Outstanding Report',
  'sales-reports': 'Sales Reports',
  expenses: 'Expenses',
  'expense-reports': 'Expense Reports',
  'profit-dashboard': 'Profit Dashboard',
  'owner-dashboard': 'Owner Dashboard',
  'standard-reports': 'Standard Reports',
  'exception-reports': 'Exception Reports',
  analytics: 'Analytics',
  help: 'Help',
  settings: 'Settings',
  'payments-management': 'Payments Management',
  'payment-reconciliation': 'Payment Reconciliation',
  'payment-reminders': 'Payment Reminders',
  'payment-analytics': 'Payment Analytics',
  'backup-management': 'Backup Management',
  'enhanced-dashboard': 'Enhanced Dashboard',
  'export-management': 'Export Management',
  'lead-manager': 'Lead Manager',
  parcels: 'Parcels',
  new: 'New',
  edit: 'Edit',
};

const toTitleCase = (value) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getLabel = (segment, index, segments) => {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];

  // Handle route params after special segments (e.g. /edit/:id, /yield/:id)
  const prev = segments[index - 1];
  if (prev === 'edit' || prev === 'yield') return `#${segment}`;

  return toTitleCase(segment);
};

const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const label = getLabel(segment, index, segments);
    return { path, label };
  });

  return (
    <div className="px-4 md:px-6 py-2.5 border-b border-gray-200/70 bg-white/70 backdrop-blur-sm">
      <nav className="flex items-center gap-1 text-xs md:text-sm overflow-x-auto scrollbar-hide" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors whitespace-nowrap">
          <Home size={14} />
          <span>Home</span>
        </Link>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <div key={crumb.path} className="flex items-center gap-1 whitespace-nowrap">
              <ChevronRight size={14} className="text-gray-400" />
              {isLast ? (
                <span className="font-semibold text-gray-800">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-gray-500 hover:text-primary-600 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
