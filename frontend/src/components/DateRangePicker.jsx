import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DateRangePicker Component
 * Provides both preset time ranges and custom date selection
 *
 * @param {Object} props
 * @param {string} props.timeRange - Current time range ('DAY', 'WEEK', 'MONTH', 'CUSTOM', '')
 * @param {string} props.startDate - Custom start date (YYYY-MM-DD)
 * @param {string} props.endDate - Custom end date (YYYY-MM-DD)
 * @param {Function} props.onTimeRangeChange - Callback when time range changes
 * @param {Function} props.onCustomDateChange - Callback when custom dates change
 * @param {boolean} props.showAllTime - Whether to show "All Time" option (default: true)
 */
const DateRangePicker = ({
  timeRange,
  startDate,
  endDate,
  onTimeRangeChange,
  onCustomDateChange,
  showAllTime = true
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate || '');
  const [tempEndDate, setTempEndDate] = useState(endDate || '');

  const handleTimeRangeChange = (value) => {
    if (value === 'CUSTOM') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onTimeRangeChange(value);
    }
  };

  const handleApplyCustomRange = () => {
    if (!tempStartDate || !tempEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);

    if (start > end) {
      alert('Start date cannot be after end date');
      return;
    }

    onCustomDateChange(tempStartDate, tempEndDate);
    setShowCustomPicker(false);
  };

  const handleCancelCustomRange = () => {
    setTempStartDate(startDate || '');
    setTempEndDate(endDate || '');
    setShowCustomPicker(false);
  };

  const getDisplayText = () => {
    if (timeRange === 'CUSTOM' && startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}`;
    }
    return null;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <select
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-soft"
        >
          <option value="DAY">Today</option>
          <option value="WEEK">This Week</option>
          <option value="MONTH">This Month</option>
          <option value="CUSTOM">Custom Range</option>
          {showAllTime && <option value="">All Time</option>}
        </select>

        {timeRange === 'CUSTOM' && getDisplayText() && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700">
            <Calendar className="w-4 h-4" />
            <span>{getDisplayText()}</span>
          </div>
        )}
      </div>

      {/* Custom Date Range Modal */}
      <AnimatePresence>
        {showCustomPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleCancelCustomRange}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-strong border border-gray-200 p-6 z-50 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-bold text-gray-900">Select Date Range</h3>
                </div>
                <button
                  onClick={handleCancelCustomRange}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    max={tempEndDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    min={tempStartDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> Select a date range to filter data for a specific period.
                    The maximum end date is today.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!tempStartDate || !tempEndDate}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Range
                </button>
                <button
                  onClick={handleCancelCustomRange}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
