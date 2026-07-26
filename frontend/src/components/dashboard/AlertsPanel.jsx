import { motion } from 'framer-motion';
import { AlertTriangle, Clock, DollarSign, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AlertsPanel = ({ alerts = [], delay = 0 }) => {
  const navigate = useNavigate();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'stock':
        return AlertTriangle;
      case 'pending':
        return Clock;
      case 'payment':
        return DollarSign;
      case 'wastage':
        return TrendingDown;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (index * 0.1) }}
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => alert.path && navigate(alert.path)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{alert.title}</p>
                    <p className="text-xs opacity-80">{alert.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts at the moment</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AlertsPanel;
