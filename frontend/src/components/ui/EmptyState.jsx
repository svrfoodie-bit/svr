import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

/**
 * Reusable empty state with optional CTA button.
 *
 * Usage:
 *   <EmptyState
 *     icon={Users}
 *     message="No customers yet"
 *     subtext="Add your first customer to get started"
 *     action={{ label: '+ Add Customer', onClick: () => navigate('/customers/new') }}
 *   />
 */
const EmptyState = ({ icon: Icon = Inbox, message = 'No records found', subtext = '', action = null }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
      <Icon className="w-10 h-10 text-gray-300" />
    </div>
    <p className="text-gray-700 font-semibold text-base mb-1">{message}</p>
    {subtext && <p className="text-sm text-gray-400 mb-5 max-w-xs">{subtext}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-1 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold text-sm shadow-soft transition-all"
      >
        {action.label}
      </button>
    )}
  </motion.div>
);

export default EmptyState;
