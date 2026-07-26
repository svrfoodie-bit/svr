import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { customerService, CUSTOMER_TYPES } from '../services/customerService';
import useUnsavedChanges from '../hooks/useUnsavedChanges';
import { showFallbackError } from '../utils/errorHandling';

const CustomerEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { markDirty, markClean, safeNavigate, ConfirmDialog } = useUnsavedChanges();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Retail',
    contactNumber: '',
    area: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isEditMode) loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    try {
      const customer = await customerService.getById(id);
      if (customer) {
        setFormData({
          name: customer.name,
          type: customer.type,
          contactNumber: customer.contactNumber,
          area: customer.area,
        });
      } else {
        toast.error('Customer not found');
        navigate('/customers');
      }
    } catch {
      toast.error('Failed to load customer data');
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Customer name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'type':
        if (!value) return 'Customer type is required';
        return '';
      case 'contactNumber':
        if (!value) return 'Contact number is required';
        if (!/^[0-9]{10}$/.test(value)) return 'Must be exactly 10 digits';
        return '';
      case 'area':
        if (!value.trim()) return 'Area is required';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    markDirty();
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    setTouched({ name: true, type: true, contactNumber: true, area: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      if (isEditMode) {
        await customerService.update(id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerService.create(formData);
        toast.success('Customer created successfully');
      }
      markClean();
      navigate('/customers');
    } catch (error) {
      showFallbackError(error, isEditMode ? 'Failed to update customer' : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-400'
        : 'border-gray-200 focus:ring-primary-500/30 focus:border-primary-500'
    }`;

  useKeyboardSave(handleSubmit);
  return (
    <div className="p-4 md:p-6">
      <ConfirmDialog />
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Customer' : 'New Customer'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update customer information' : 'Add a new customer to the system'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-2xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-5">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={inputClass('name')}
              placeholder="Enter customer name"
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Customer Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={inputClass('type')}
            >
              {CUSTOMER_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {touched.type && errors.type && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.type}
              </p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              onBlur={handleBlur}
              maxLength="10"
              className={inputClass('contactNumber')}
              placeholder="10 digit mobile number"
            />
            {touched.contactNumber && errors.contactNumber ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.contactNumber}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">{formData.contactNumber.length}/10 digits</p>
            )}
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Area / Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={inputClass('area')}
              placeholder="City or area name"
            />
            {touched.area && errors.area && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.area}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Important:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Customer ID will be auto-generated (C001, C002, etc.)</li>
                  <li>• Customer name must be unique</li>
                  <li>• New customers are created with "Active" status</li>
                  <li>• Only active customers can be used for sales orders</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
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
                  <span>{isEditMode ? 'Update Customer' : 'Create Customer'}</span>
                  <span className="hidden md:inline text-xs opacity-60 font-normal ml-1">Ctrl+S</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => safeNavigate('/customers')}
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

export default CustomerEntry;
