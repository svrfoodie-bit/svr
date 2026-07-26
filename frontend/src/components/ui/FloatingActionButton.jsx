import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Package, Users, DollarSign, FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      label: 'New Purchase',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      path: '/raw-purchases',
    },
    {
      label: 'Add Worker',
      icon: Users,
      color: 'from-green-500 to-green-600',
      path: '/workers',
    },
    {
      label: 'Record Payment',
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      path: '/worker-payments',
    },
    {
      label: 'Daily Entry',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      path: '/daily-work',
    },
  ];

  const handleActionClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Actions List */}
            <div className="fixed bottom-24 right-4 md:right-6 z-50 flex flex-col gap-3">
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.8 }}
                  transition={{
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  whileHover={{ scale: 1.05, x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action.path)}
                  className="flex items-center gap-3 group"
                >
                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-2 bg-white rounded-xl shadow-strong text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    {action.label}
                  </motion.span>

                  {/* Icon Button */}
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-strong`}
                  >
                    <action.icon size={20} className="text-white" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center shadow-strong hover:shadow-glow transition-shadow ${
          isOpen ? 'ring-4 ring-primary-200' : ''
        }`}
        whileHover={{ scale: 1.1, rotate: isOpen ? 0 : 90 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Plus size={24} className="text-white" />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="fixed bottom-9 right-20 md:right-24 z-40 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg shadow-strong pointer-events-none whitespace-nowrap"
          >
            Quick Actions
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingActionButton;
