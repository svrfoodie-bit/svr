import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, X, Check, Search, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerService } from '../services/customerService';
import { useDebounce } from '../hooks/useDebounce';
import usePagination from '../hooks/usePagination';
import useSort from '../hooks/useSort';
import Pagination from '../components/ui/Pagination';
import SortHeader from '../components/ui/SortHeader';
import EmptyState from '../components/ui/EmptyState';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    isActive: '',
    search: '',
  });
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    retailCustomers: 0,
    wholesaleCustomers: 0,
  });

  // Debounce filters to reduce API calls
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    loadCustomers();
    loadMetrics();
  }, [debouncedFilters]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll(debouncedFilters);
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await customerService.getSummaryMetrics(debouncedFilters);
      setMetrics(data);
    } catch (error) {
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await customerService.toggleStatus(id);
      toast.success(`Customer ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      loadCustomers();
      loadMetrics();
    } catch (error) {
      toast.error('Failed to update customer status');
    }
  };

  const handleArchive = async (id, name) => {
    try {
      await customerService.delete(id);
      toast.success(`"${name}" archived`);
      loadCustomers();
      loadMetrics();
    } catch (error) {
      toast.error('Failed to archive customer');
    }
  };

  const { sortKey, sortDir, setSort, sorted: sortedCustomers } = useSort(customers, 'name', 'asc');
  const { page, pageSize, setPage, paginated: pagedCustomers, totalPages, total } = usePagination(sortedCustomers, 25);

  const getTypeColor = (type) => {
    return type === 'Retail'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-purple-100 text-purple-700 border-purple-200';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600 mt-1">Manage retail and wholesale customers</p>
        </div>
        <button
          onClick={() => navigate('/customers/new')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Customers</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalCustomers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{metrics.activeCustomers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Retail</p>
              <p className="text-xl font-bold text-gray-900">{metrics.retailCustomers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Wholesale</p>
              <p className="text-xl font-bold text-gray-900">{metrics.wholesaleCustomers}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader col="customerId" label="Customer ID" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="contactNumber" label="Contact" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <SortHeader col="area" label="Area" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      icon={Users}
                      message="No customers found"
                      subtext={filters.search || filters.type || filters.isActive ? 'Try adjusting your filters.' : 'Add your first customer to get started.'}
                      action={!filters.search && !filters.type && !filters.isActive ? { label: '+ Add Customer', onClick: () => navigate('/customers/new') } : null}
                    />
                  </td>
                </tr>
              ) : (
                pagedCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-600">
                        {customer.customerId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{customer.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={customer.type} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.contactNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.area}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(customer.id, customer.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                          customer.isActive
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {customer.isActive ? (
                          <>
                            <Check size={14} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X size={14} />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/customers/edit/${customer.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleArchive(customer.id, customer.name)}
                          className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Archive Customer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} total={total} />
        </div>
      </div>

      {/* Info Note */}
      {!loading && customers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Customer Management:</p>
              <p className="text-sm text-blue-700">
                Only active customers can be selected for new sales orders. Toggle status to activate or deactivate customers.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerList;
