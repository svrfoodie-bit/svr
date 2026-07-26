import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionCard = ({ title, description, icon: Icon, color, path, delay = 0 }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      className="bg-white rounded-xl p-5 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer group overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 ${color} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <motion.div
            className="text-gray-400 group-hover:text-primary-600"
            whileHover={{ x: 4 }}
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>

        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export default QuickActionCard;
