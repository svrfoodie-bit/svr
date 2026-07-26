import { motion } from 'framer-motion';

/**
 * Table Loading Skeleton Component
 * Displays animated skeleton while data is loading
 */
export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.05 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                {colIndex === 0 && <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Card Loading Skeleton Component
 * For dashboard cards and metric displays
 */
export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-8 bg-gray-300 rounded animate-pulse w-3/4 mb-3" />
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * List Loading Skeleton Component
 * For simple list items
 */
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-2">
      {[...Array(items)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Form Loading Skeleton Component
 * For forms and input fields
 */
export const FormSkeleton = ({ fields = 6 }) => {
  return (
    <div className="space-y-4">
      {[...Array(fields)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="space-y-2"
        >
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-10 bg-gray-100 rounded animate-pulse w-full" />
        </motion.div>
      ))}
      <div className="flex justify-end space-x-3 mt-6">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-300 rounded animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Chart Loading Skeleton Component
 * For charts and graphs
 */
export const ChartSkeleton = ({ height = 300 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      style={{ height: `${height}px` }}
    >
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3 mb-6" />
      <div className="flex items-end justify-between h-full pb-8">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="bg-gray-200 rounded-t animate-pulse"
            style={{
              width: '10%',
              height: `${Math.random() * 70 + 30}%`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Detailed Loading Skeleton Component
 * For detailed views and reports
 */
export const DetailsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <div className="h-8 bg-gray-300 rounded animate-pulse w-1/3 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-5 bg-gray-100 rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Content Sections */}
      {[...Array(3)].map((_, sectionIndex) => (
        <motion.div
          key={sectionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, lineIndex) => (
              <div key={lineIndex} className="flex items-center justify-between">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Grid Loading Skeleton Component
 * For grid layouts
 */
export const GridSkeleton = ({ items = 6, columns = 3 }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
      {[...Array(items)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="h-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-5 bg-gray-300 rounded animate-pulse w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
        </motion.div>
      ))}
    </div>
  );
};

// Default export with all skeleton types
export default {
  Table: TableSkeleton,
  Card: CardSkeleton,
  List: ListSkeleton,
  Form: FormSkeleton,
  Chart: ChartSkeleton,
  Details: DetailsSkeleton,
  Grid: GridSkeleton,
};
