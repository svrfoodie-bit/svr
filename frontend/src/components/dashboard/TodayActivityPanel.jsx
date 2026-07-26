import { motion } from 'framer-motion';
import { Package, Users, Truck, TrendingUp, TrendingDown } from 'lucide-react';

const TodayActivityPanel = ({ activities = [], delay = 0 }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase':
        return Package;
      case 'workers':
        return Users;
      case 'dispatch':
        return Truck;
      case 'inflow':
        return TrendingUp;
      case 'outflow':
        return TrendingDown;
      default:
        return Package;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>

      <div className="grid grid-cols-2 gap-3">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + (index * 0.1) }}
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-primary-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activity.iconBg || 'bg-primary-100'}`}>
                  <Icon className={`w-4 h-4 ${activity.iconColor || 'text-primary-600'}`} />
                </div>
                <p className="text-xs font-medium text-gray-600">{activity.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{activity.value}</p>
              {activity.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{activity.subtitle}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TodayActivityPanel;
