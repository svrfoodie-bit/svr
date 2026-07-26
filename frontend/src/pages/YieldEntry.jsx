import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import {
  getLossReasons,
  getOutputGrades,
  getRawTypeLabel,
  processingBatchService,
} from '../services/processingBatchService';

const YieldEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState(null);

  // Output data for each raw stock type
  const [yieldData, setYieldData] = useState(
    getOutputGrades('White').map(grade => ({ grade, quantity: '' }))
  );

  // Loss data for each reason
  const [wastageData, setWastageData] = useState(
    getLossReasons('White').map(reason => ({ reason, quantity: '' }))
  );

  const getStatusLabel = (status) => {
    if (status === 'Open') return 'In Progress';
    if (status === 'Closed') return 'Completed';
    return status;
  };

  const getOutputHint = (rawType) => {
    if (rawType === 'RWA') {
      return 'Enter white cashew output from raw cashew processing. Finished grade fields are used only for White Cashew production.';
    }
    return 'Enter graded finished output from white cashew stock.';
  };

  useEffect(() => {
    loadBatchData();
  }, [id]);

  const loadBatchData = async () => {
    try {
      const batchData = await processingBatchService.getById(id);
      if (batchData) {
        if (batchData.status === 'Closed') {
          toast.error('Production batch is already completed');
          navigate('/batches');
          return;
        }
        setBatch(batchData);
        const outputGrades = getOutputGrades(batchData.rawType);
        const lossReasons = getLossReasons(batchData.rawType);

        // Pre-populate if data exists
        if (batchData.yieldData && batchData.yieldData.length > 0) {
          setYieldData(outputGrades.map(grade => {
            const existing = batchData.yieldData.find(y => y.grade === grade);
            return { grade, quantity: existing ? existing.quantity.toString() : '' };
          }));
        } else {
          setYieldData(outputGrades.map(grade => ({ grade, quantity: '' })));
        }

        if (batchData.wastageData && batchData.wastageData.length > 0) {
          setWastageData(lossReasons.map(reason => {
            const existing = batchData.wastageData.find(w => w.reason === reason);
            return { reason, quantity: existing ? existing.quantity.toString() : '' };
          }));
        } else {
          setWastageData(lossReasons.map(reason => ({ reason, quantity: '' })));
        }
      } else {
        toast.error('Production batch not found');
        navigate('/batches');
      }
    } catch (error) {
      toast.error('Failed to load production data');
    }
  };

  const handleYieldChange = (index, value) => {
    const newYieldData = [...yieldData];
    newYieldData[index].quantity = value;
    setYieldData(newYieldData);
  };

  const handleWastageChange = (index, value) => {
    const newWastageData = [...wastageData];
    newWastageData[index].quantity = value;
    setWastageData(newWastageData);
  };

  const calculateTotals = () => {
    const totalOutput = yieldData.reduce((sum, item) =>
      sum + (parseFloat(item.quantity) || 0), 0
    );
    const totalWastage = wastageData.reduce((sum, item) =>
      sum + (parseFloat(item.quantity) || 0), 0
    );

    return { totalOutput, totalWastage };
  };

  const { totalOutput, totalWastage } = calculateTotals();
  const totalAccountedFor = totalOutput + totalWastage;
  const unaccountedQuantity = batch ? batch.rawInputQuantity - totalAccountedFor : 0;
  const yieldPercentage = batch && batch.rawInputQuantity > 0
    ? ((totalOutput / batch.rawInputQuantity) * 100).toFixed(2)
    : 0;
  const wastagePercentage = batch && batch.rawInputQuantity > 0
    ? ((totalWastage / batch.rawInputQuantity) * 100).toFixed(2)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation: must have some output
      if (totalOutput === 0) {
        toast.error('Total output cannot be zero');
        setLoading(false);
        return;
      }

      // Validation: output + loss <= raw quantity
      if (totalAccountedFor > batch.rawInputQuantity) {
        toast.error('Total output + loss cannot exceed raw quantity');
        setLoading(false);
        return;
      }

      // Filter out empty entries
      const filteredYield = yieldData.filter(item => parseFloat(item.quantity) > 0);
      const filteredWastage = wastageData.filter(item => parseFloat(item.quantity) > 0);

      // Close the batch and create finished stock entries.
      await processingBatchService.addYieldAndWastage(id, filteredYield, filteredWastage);

      toast.success('Production completed and finished stock created');
      navigate('/batches');
    } catch (error) {
      toast.error(error.message || 'Failed to save output and loss data');
    } finally {
      setLoading(false);
    }
  };

  useKeyboardSave(handleSubmit);

  if (!batch) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading production data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Add Output & Loss - {batch.batchId}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Record finished goods output and loss to create sellable stock
        </p>
      </div>

        {/* Production Info */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Production Date</p>
            <p className="font-semibold text-gray-900">{new Date(batch.date).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Raw Stock</p>
            <p className="font-semibold text-gray-900">{getRawTypeLabel(batch.rawType)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Raw Quantity</p>
            <p className="font-semibold text-gray-900">{batch.rawInputQuantity} KG</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Status</p>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-lg border bg-blue-100 text-blue-700 border-blue-200">
              {getStatusLabel(batch.status)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        {/* Output Data */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">
              {batch.rawType === 'RWA' ? 'White Cashew Output' : 'Finished Output'}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">{getOutputHint(batch.rawType)}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yieldData.map((item, index) => (
              <div key={item.grade}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {item.grade} (KG)
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleYieldChange(index, e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Output:</span>
              <span className="text-xl font-bold text-green-600">{totalOutput.toFixed(2)} KG</span>
            </div>
          </div>
        </div>

        {/* Loss Data */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Loss / Waste - {getRawTypeLabel(batch.rawType)}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wastageData.map((item, index) => (
              <div key={item.reason}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {item.reason} (KG)
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleWastageChange(index, e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Loss:</span>
              <span className="text-xl font-bold text-red-600">{totalWastage.toFixed(2)} KG</span>
            </div>
          </div>
        </div>

        {/* Summary & Validation */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Production Summary</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-medium text-gray-700">Raw Quantity:</span>
              <span className="font-semibold text-gray-900">{batch.rawInputQuantity} KG</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-medium text-gray-700">Total Output:</span>
              <span className="font-semibold text-green-600">{totalOutput.toFixed(2)} KG ({yieldPercentage}%)</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-medium text-gray-700">Total Loss:</span>
              <span className="font-semibold text-red-600">{totalWastage.toFixed(2)} KG ({wastagePercentage}%)</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-medium text-gray-700">Total Accounted:</span>
              <span className="font-semibold text-gray-900">{totalAccountedFor.toFixed(2)} KG</span>
            </div>

            <div className={`flex items-center justify-between ${unaccountedQuantity !== 0 ? 'bg-yellow-50 rounded-lg p-3' : ''}`}>
              <span className="text-sm font-medium text-gray-700">Unaccounted:</span>
              <span className={`font-bold ${unaccountedQuantity > 0 ? 'text-yellow-600' : unaccountedQuantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {unaccountedQuantity.toFixed(2)} KG
              </span>
            </div>
          </div>

          {/* Validation Messages */}
          {totalOutput === 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Total output cannot be zero. Please enter finished output for at least one grade.
                </p>
              </div>
            </div>
          )}

          {totalAccountedFor > batch.rawInputQuantity && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Total output + loss ({totalAccountedFor.toFixed(2)} KG) exceeds raw quantity ({batch.rawInputQuantity} KG).
                  Please verify the entered quantities.
                </p>
              </div>
            </div>
          )}

          {unaccountedQuantity > 0 && totalAccountedFor <= batch.rawInputQuantity && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  {unaccountedQuantity.toFixed(2)} KG is unaccounted. Make sure all output and loss is recorded accurately.
                </p>
              </div>
            </div>
          )}

          {totalOutput > 0 && totalAccountedFor <= batch.rawInputQuantity && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  Ready to complete production. Finished stock will be created automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || totalOutput === 0 || totalAccountedFor > batch.rawInputQuantity}
            className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold shadow-soft hover:shadow-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Complete Production</span>
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
      </form>
    </div>
  );
};

export default YieldEntry;
