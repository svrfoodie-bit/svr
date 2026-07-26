import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Activity } from 'lucide-react';

const ActivityTimeline = ({ activities = [] }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'pending':
        return 'bg-yellow-100 border-yellow-200';
      case 'alert':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Activity className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">No recent activity</p>
        <p className="text-xs text-gray-300 mt-1">Actions will appear here as you use the app</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-3 group"
        >
          <div className="relative flex flex-col items-center">
            <div className={`p-2 rounded-full border-2 ${getColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2" />
            )}
          </div>

          <div className="flex-1 pb-6">
            <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-gray-100 transition-colors">
              <p className="font-medium text-sm text-gray-900">{activity.title}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
