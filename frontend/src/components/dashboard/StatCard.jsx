import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, change, changeType = 'up', icon: Icon, color, delay = 0, subtitle }) => {
  const getTrendIcon = () => {
    if (changeType === 'up') return <TrendingUp className="w-4 h-4" />;
    if (changeType === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (changeType === 'up') return 'text-green-600 bg-green-50';
    if (changeType === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:border-primary-200 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <motion.div
          className={`p-3 rounded-xl ${color} shadow-soft`}
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <motion.h3
          className="text-3xl font-bold text-gray-900"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
        >
          {value}
        </motion.h3>

        {change && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${getTrendColor()}`}
          >
            {getTrendIcon()}
            <span>{change}</span>
            <span className="text-gray-500 font-normal">vs last month</span>
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`}
          initial={{ width: 0 }}
          animate={{ width: '75%' }}
          transition={{ delay: delay + 0.4, duration: 1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

export default StatCard;
