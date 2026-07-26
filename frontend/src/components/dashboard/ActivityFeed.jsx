import { motion } from 'framer-motion';
import { Package, CheckCircle, Truck, DollarSign, Users } from 'lucide-react';

const ActivityFeed = ({ activities = [], delay = 0 }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase':
        return Package;
      case 'completion':
        return CheckCircle;
      case 'dispatch':
        return Truck;
      case 'payment':
        return DollarSign;
      case 'worker':
        return Users;
      default:
        return Package;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-100 text-blue-600';
      case 'completion':
        return 'bg-green-100 text-green-600';
      case 'dispatch':
        return 'bg-purple-100 text-purple-600';
      case 'payment':
        return 'bg-yellow-100 text-yellow-600';
      case 'worker':
        return 'bg-primary-100 text-primary-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Feed</h3>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (index * 0.05) }}
                className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
              >
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityFeed;
