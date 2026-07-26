import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, ToggleLeft, ToggleRight, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workerService } from '../services/workerService';
import { useDebounce } from '../hooks/useDebounce';

const WorkerList = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    loadWorkers();
  }, [debouncedFilters, debouncedSearchTerm]);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await workerService.getAll({
        ...debouncedFilters,
        search: debouncedSearchTerm,
      });
      setWorkers(data);
    } catch (error) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (workerId, currentStatus) => {
    try {
      await workerService.toggleStatus(workerId, currentStatus);
      toast.success('Worker status updated');
      loadWorkers();
    } catch (error) {}
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    const confirmed = window.confirm(`Delete worker "${workerName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await workerService.delete(workerId);
      toast.success('Worker deleted successfully');
      loadWorkers();
    } catch (error) {}
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTypeColor = (type) => {
    return type === 'Permanent'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-purple-100 text-purple-700 border-purple-200';
  };

  const getWorkerType = (worker) => worker.type || worker.areaOfWork || '-';
  const getWorkerContact = (worker) => worker.contactNumber || worker.mobileNumber || '-';
  const getWorkerJoiningDate = (worker) => {
    const rawDate = worker.joiningDate || worker.dateOfBirth || worker.createdAt;
    if (!rawDate) return '-';

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString('en-IN');
  };

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      !debouncedSearchTerm ||
      worker.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      worker.workerId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesType =
      !debouncedFilters.type ||
      getWorkerType(worker) === debouncedFilters.type;

    const matchesStatus =
      debouncedFilters.isActive === undefined ||
      (debouncedFilters.isActive ? worker.status === 'Active' : worker.status === 'Inactive');

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Workers</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your workforce</p>
        </div>
        <button
          onClick={() => navigate('/workers/new')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
        >
          <Plus size={20} />
          <span>Add Worker</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Worker Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Types</option>
            <option value="Permanent">Permanent</option>
            <option value="Temporary">Temporary</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.isActive === true ? 'active' : filters.isActive === false ? 'inactive' : 'all'}
            onChange={(e) => {
              const value = e.target.value === 'active' ? true : e.target.value === 'inactive' ? false : undefined;
              setFilters(prev => ({ ...prev, isActive: value }));
            }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Worker ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
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
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No workers found
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker, index) => (
                  <motion.tr
                    key={worker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-600">
                        {worker.workerId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {worker.name.charAt(0)}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{worker.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getTypeColor(getWorkerType(worker))}`}>
                        {getWorkerType(worker)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{getWorkerContact(worker)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{getWorkerJoiningDate(worker)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(worker.status === 'Active')}`}>
                        {worker.status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/workers/edit/${worker.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Worker"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(worker.id, worker.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            worker.status === 'Active'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title={worker.status === 'Active' ? 'Deactivate worker' : 'Activate worker'}
                        >
                          {worker.status === 'Active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id, worker.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Worker"
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
        </div>
      </div>

      {/* Summary */}
      {!loading && filteredWorkers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-xl p-4"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <span>Total Workers: <strong className="text-gray-900">{filteredWorkers.length}</strong></span>
          </div>
          <div className="flex gap-4">
            <span>Active: <strong className="text-green-600">{filteredWorkers.filter(w => w.status === 'Active').length}</strong></span>
            <span>Inactive: <strong className="text-gray-600">{filteredWorkers.filter(w => !w.status === 'Active').length}</strong></span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WorkerList;
