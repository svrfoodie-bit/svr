import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { workerService } from '../services/workerService';

const WorkerEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Permanent',
    contactNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isEditMode) {
      loadWorkerData();
    }
  }, [id]);

  const loadWorkerData = async () => {
    try {
      const worker = await workerService.getById(id);
      if (worker) {
        setFormData({
          name: worker.name || '',
          type: worker.type || worker.areaOfWork || 'Permanent',
          contactNumber: worker.contactNumber || worker.mobileNumber || '',
          joiningDate: (worker.joiningDate || worker.dateOfBirth || worker.createdAt || '').split('T')[0] || new Date().toISOString().split('T')[0],
        });
      } else {
        toast.error('Worker not found');
        navigate('/workers');
      }
    } catch (error) {
      toast.error('Failed to load worker data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Please enter worker name');
        setLoading(false);
        return;
      }

      if (isEditMode) {
        await workerService.update(id, formData);
        toast.success('Worker updated successfully');
      } else {
        await workerService.create(formData);
        toast.success('Worker added successfully');
      }

      navigate('/workers');
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update worker' : 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  };

  useKeyboardSave(handleSubmit);
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Worker' : 'Add New Worker'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update worker information' : 'Add a new worker to your workforce'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">
          {/* Worker Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Worker Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              placeholder="Enter worker name"
              required
            />
          </div>

          {/* Worker Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Worker Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              required
            >
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              placeholder="Enter contact number"
              pattern="[0-9]{10}"
              maxLength="10"
            />
            <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              required
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Worker ID will be auto-generated. New workers are marked as active by default.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft hover:shadow-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{isEditMode ? 'Update Worker' : 'Add Worker'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/workers')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WorkerEntry;
