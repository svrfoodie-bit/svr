import { useState, useEffect } from 'react';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { getRawTypeLabel, processingBatchService, RAW_TYPES } from '../services/processingBatchService';

const BatchEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [batchDetails, setBatchDetails] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    rawType: 'RWA',
    rawInputQuantity: '',
    remarks: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadBatchData();
    }
  }, [id]);

  const loadBatchData = async () => {
    try {
      const batch = await processingBatchService.getById(id);
      if (batch) {
        if (batch.status === 'Closed') {
          setIsClosed(true);
          setBatchDetails(batch);
          return;
        }

        setFormData({
          date: batch.date,
          rawType: batch.rawType,
          rawInputQuantity: batch.rawInputQuantity,
          remarks: batch.remarks || '',
        });
      } else {
        toast.error('Production batch not found');
        navigate('/batches');
      }
    } catch (error) {
      toast.error('Failed to load production batch');
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
      const batchData = {
        ...formData,
        rawInputQuantity: parseFloat(formData.rawInputQuantity),
      };

      if (isEditMode) {
        await processingBatchService.update(id, batchData);
        toast.success('Production updated successfully');
      } else {
        await processingBatchService.create(batchData);
        toast.success('Production created successfully');
      }

      navigate('/batches');
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update production' : 'Failed to create production');
    } finally {
      setLoading(false);
    }
  };

  useKeyboardSave(handleSubmit);

  if (isClosed && batchDetails) {
    return (
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <CheckCircle className="w-7 h-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production Details</h1>
            <p className="text-sm text-gray-500">This production batch is completed and cannot be edited</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-4">
          {[
            ['Production ID', batchDetails.batchId],
            ['Date', batchDetails.date],
            ['Raw Stock', getRawTypeLabel(batchDetails.rawType)],
            ['Raw Quantity (KG)', batchDetails.rawInputQuantity],
            ['Total Output (KG)', batchDetails.totalOutput ?? '-'],
            ['Total Loss (KG)', batchDetails.totalWastage ?? '-'],
            ['Output %', batchDetails.yieldPercentage ? `${batchDetails.yieldPercentage}%` : '-'],
            ['Status', batchDetails.status],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/batches')}
          className="mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2"
        >
          <X size={20} /> Back to Production
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Production' : 'New Production Batch'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode ? 'Update production information' : 'Start converting raw cashew into finished stock'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Production Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Raw Stock <span className="text-red-500">*</span>
            </label>
            <select
              name="rawType"
              value={formData.rawType}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              required
              disabled={isEditMode}
            >
              {RAW_TYPES.map(type => (
                <option key={type} value={type}>{getRawTypeLabel(type)}</option>
              ))}
            </select>
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">Raw stock type cannot be changed after creation</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Raw Quantity (KG) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rawInputQuantity"
              value={formData.rawInputQuantity}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter how much raw cashew is going into production</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
              placeholder="Additional notes about this production..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">How this is used:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>- Production ID will be auto-generated</li>
                  <li>- This creates an in-progress production batch</li>
                  <li>- Use Daily Work separately to track worker tasks and wages</li>
                  <li>- Raw Cashew output records White Cashew only</li>
                  <li>- White Cashew output records final grades like Full Kaju and Pieces</li>
                  <li>- Raw Cashew and White Cashew have different loss fields</li>
                  <li>- Finished output will become available in Sales Orders</li>
                </ul>
              </div>
            </div>
          </div>

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
                  <span>{isEditMode ? 'Update Production' : 'Create Production'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/batches')}
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

export default BatchEntry;
