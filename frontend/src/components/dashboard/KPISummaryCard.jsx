import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPISummaryCard = ({ title, value, unit, rupees, change, changeType, icon: Icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-soft">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <motion.h3
            className="text-3xl font-bold text-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.h3>
          <span className="text-sm text-gray-500 font-medium">{unit}</span>
        </div>

        {rupees && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-primary-600">₹{rupees.toLocaleString('en-IN')}</span>
          </p>
        )}

        {change && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              changeType === 'up' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
            }`}
          >
            {changeType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{change}</span>
            <span className="text-gray-500 font-normal">vs yesterday</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default KPISummaryCard;
