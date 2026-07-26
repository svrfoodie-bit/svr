import { motion } from 'framer-motion';

const StockSummary = ({ title, stocks, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-3">
        {stocks.map((stock, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + (index * 0.1) }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${stock.color || 'bg-primary-500'}`} />
              <span className="font-medium text-gray-700">{stock.label}</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{stock.kg} KG</p>
              <p className="text-xs text-gray-600">₹{stock.value.toLocaleString('en-IN')}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4 }}
        className="mt-4 pt-4 border-t border-gray-200"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">Total</span>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">
              {stocks.reduce((sum, stock) => sum + stock.kg, 0).toLocaleString()} KG
            </p>
            <p className="text-sm text-primary-600 font-semibold">
              ₹{stocks.reduce((sum, stock) => sum + stock.value, 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StockSummary;
