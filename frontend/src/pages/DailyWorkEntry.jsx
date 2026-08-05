import { useState, useEffect } from 'react';
import { Save, X, Award, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { dailyWorkService, WORK_TYPES } from '../services/dailyWorkService';
import { workerService } from '../services/workerService';
import { showFallbackError } from '../utils/errorHandling';
import Modal from '../components/ui/Modal';

const DailyWorkEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [addingWorker, setAddingWorker] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    workerName: '',
    workType: 'Shelling',
    assignedQuantity: '',
    completedQuantity: '0',
    rate: '20',
    bonusPerKg: '',
    status: 'Pending',
    remarks: '',
  });

  useEffect(() => {
    loadWorkers();
    if (isEditMode) {
      loadDailyWorkData();
    }
  }, [id]);

  const loadWorkers = async () => {
    try {
      const data = await workerService.getAll();
      setWorkers(data);
    } catch (error) {
      toast.error('Failed to load workers');
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();

    if (!newWorkerName.trim()) {
      toast.error('Please enter worker name');
      return;
    }

    setAddingWorker(true);
    try {
      const worker = await workerService.create({
        name: newWorkerName.trim(),
        type: 'Permanent',
        joiningDate: new Date().toISOString().split('T')[0],
      });

      toast.success('Worker added successfully');
      setNewWorkerName('');
      setShowAddWorker(false);

      const updatedWorkers = await workerService.getAll();
      setWorkers(updatedWorkers);
      setFormData((prev) => ({ ...prev, workerId: String(worker.id), workerName: worker.name }));
    } catch (error) {
      toast.error('Failed to add worker');
    } finally {
      setAddingWorker(false);
    }
  };

  const loadDailyWorkData = async () => {
    try {
      const work = await dailyWorkService.getById(id);
      if (work) {
        const assignedQuantity = parseFloat(work.assignedQuantity ?? work.quantity) || 0;
        const completedQuantity = parseFloat(work.completedQuantity ?? work.quantity) || 0;
        const computedStatus = completedQuantity <= 0
          ? 'Pending'
          : assignedQuantity > 0 && completedQuantity >= assignedQuantity
            ? 'Completed'
            : (work.status || 'In Progress');

        setFormData({
          date: String(work.date || work.workDate || '').slice(0, 10),
          workerId: work.workerId.toString(),
          workerName: work.workerName || '',
          workType: work.workType,
          assignedQuantity: (work.assignedQuantity ?? work.quantity)?.toString() || '',
          completedQuantity: (work.completedQuantity ?? work.quantity)?.toString() || '',
          rate: work.rate?.toString() || '',
          bonusPerKg: work.bonusRate !== undefined && work.bonusRate !== null ? work.bonusRate.toString() : '',
          status: computedStatus,
          remarks: work.remarks || work.notes || '',
        });
      } else {
        toast.error('Work log not found');
        navigate('/daily-work');
      }
    } catch (error) {
      toast.error('Failed to load work log data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'workerId') {
      const worker = workers.find((item) => item.id === parseInt(value, 10));
      setFormData((prev) => ({
        ...prev,
        workerId: value,
        workerName: worker ? worker.name : '',
      }));
      return;
    }

    if (name === 'workType') {
      const workTypeInfo = WORK_TYPES[value];
      setFormData((prev) => ({
        ...prev,
        workType: value,
        rate: workTypeInfo ? workTypeInfo.defaultRate.toString() : prev.rate,
        bonusPerKg: workTypeInfo?.bonusEligible ? prev.bonusPerKg : '',
      }));
      return;
    }

    if (name === 'assignedQuantity' || name === 'completedQuantity') {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        const nextAssigned = parseFloat(next.assignedQuantity) || 0;
        const nextCompleted = parseFloat(next.completedQuantity) || 0;

        let nextStatus = 'In Progress';
        if (nextCompleted <= 0) nextStatus = 'Pending';
        if (nextAssigned > 0 && nextCompleted >= nextAssigned) nextStatus = 'Completed';

        return { ...next, status: nextStatus };
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const workTypeInfo = WORK_TYPES[formData.workType];
  const assignedQuantity = parseFloat(formData.assignedQuantity) || 0;
  const completedQuantity = parseFloat(formData.completedQuantity) || 0;
  const shortageQuantity = assignedQuantity > 0 ? Math.max(assignedQuantity - completedQuantity, 0) : 0;
  const shortagePct = assignedQuantity > 0 ? (shortageQuantity / assignedQuantity) * 100 : 0;
  const rate = parseFloat(formData.rate) || 0;
  const bonusPerKg = workTypeInfo?.bonusEligible ? (parseFloat(formData.bonusPerKg) || 0) : 0;
  const baseWage = (completedQuantity * rate).toFixed(2);
  const bonusAmount = (completedQuantity * bonusPerKg).toFixed(2);
  const totalPay = (parseFloat(baseWage) + parseFloat(bonusAmount)).toFixed(2);
  const suggestedStatus = completedQuantity <= 0
    ? 'Pending'
    : assignedQuantity > 0 && completedQuantity >= assignedQuantity
      ? 'Completed'
      : 'In Progress';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.workerId) {
        toast.error('Please select a worker');
        setLoading(false);
        return;
      }

      if (completedQuantity > assignedQuantity && assignedQuantity > 0) {
        toast.error('Completed quantity cannot be more than assigned quantity');
        setLoading(false);
        return;
      }

      const workData = {
        ...formData,
        workerId: parseInt(formData.workerId, 10),
        assignedQuantity,
        quantity: completedQuantity,
        rate,
        bonusRate: bonusPerKg,
        bonusAmount: parseFloat(bonusAmount),
        totalAmount: parseFloat(totalPay),
        bonusEligible: !!workTypeInfo?.bonusEligible,
      };

      if (isEditMode) {
        await dailyWorkService.update(id, workData);
        toast.success('Work log updated successfully');
      } else {
        await dailyWorkService.create(workData);
        toast.success('Work log recorded successfully');
      }

      navigate('/daily-work');
    } catch (error) {
      showFallbackError(error, isEditMode ? 'Failed to update work log' : 'Failed to save work log');
    } finally {
      setLoading(false);
    }
  };

  useKeyboardSave(handleSubmit);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isEditMode ? 'Record Collected Weight' : 'New Work Log'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode
            ? 'Enter the weight collected back and update the task status'
            : 'Record the material handed to a worker this morning'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Worker <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddWorker(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  <Plus size={14} />
                  Add Worker
                </button>
              </div>
              <select
                name="workerId"
                value={formData.workerId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                <option value="">Select Worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.workerId}){worker.status === 'Inactive' ? ' - Inactive' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Work Type <span className="text-red-500">*</span>
            </label>
            <select
              name="workType"
              value={formData.workType}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              required
            >
              <optgroup label="Bonus Eligible">
                <option value="Roasting">Roasting</option>
                <option value="Steaming">Steaming</option>
                <option value="Shelling">Shelling</option>
                <option value="Peeling">Peeling</option>
                <option value="Grading">Grading</option>
              </optgroup>
              <optgroup label="Non-Bonus Tasks">
                <option value="Flavoring">Flavoring</option>
                <option value="Packing">Packing</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Drying">Drying</option>
              </optgroup>
            </select>
            {workTypeInfo && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${workTypeInfo.bonusEligible ? 'text-green-600' : 'text-gray-500'}`}>
                {workTypeInfo.bonusEligible && <Award className="w-4 h-4" />}
                <span>{workTypeInfo.bonusEligible ? 'Bonus Eligible' : 'Not Bonus Eligible'}</span>
              </div>
            )}
          </div>

          {isEditMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Task Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Auto-suggested as {suggestedStatus} based on the quantities below — override only if needed.
              </p>
            </div>
          )}

          <div className={isEditMode ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assigned Quantity (KG) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="assignedQuantity"
                value={formData.assignedQuantity}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0.00"
                required
              />
              {!isEditMode && (
                <p className="mt-2 text-xs text-gray-500">
                  This is the weight of material you're handing over now. You'll come back and enter the collected
                  weight this evening — the pay and any shortage will be calculated then.
                </p>
              )}
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Completed Quantity (KG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="completedQuantity"
                  value={formData.completedQuantity}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max={formData.assignedQuantity || undefined}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="0.00"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the weight you collected back and weighed.
                </p>
              </div>
            )}
          </div>

          {isEditMode && assignedQuantity > 0 && formData.completedQuantity !== '' && (
            <div
              className={`rounded-xl p-4 border flex items-center justify-between ${
                shortagePct > 10
                  ? 'bg-red-50 border-red-200'
                  : shortageQuantity > 0
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-green-50 border-green-200'
              }`}
            >
              <div>
                <span className="text-sm font-medium text-gray-700">Shortage / Loss:</span>
                {shortagePct > 10 && (
                  <p className="text-xs text-red-500 mt-0.5">High shortage — please verify the weight</p>
                )}
              </div>
              <span
                className={`text-lg font-bold ${
                  shortagePct > 10 ? 'text-red-600' : shortageQuantity > 0 ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {shortageQuantity > 0
                  ? `${shortageQuantity.toLocaleString('en-IN')} KG (${shortagePct.toFixed(1)}%)`
                  : 'None'}
              </span>
            </div>
          )}

          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate per KG (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0.00"
                required
              />
          </div>

          {workTypeInfo?.bonusEligible && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bonus (INR) per kg
              </label>
              <input
                type="number"
                name="bonusPerKg"
                value={formData.bonusPerKg}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                placeholder="0.00"
              />
              <p className="mt-2 text-xs text-gray-500">
                Total bonus is calculated as Completed Quantity x Bonus per KG.
              </p>
            </div>
          )}

          {isEditMode ? (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Base Wage:</span>
                <span className="text-lg font-semibold text-gray-900">INR {parseFloat(baseWage).toLocaleString('en-IN')}</span>
              </div>

              {workTypeInfo?.bonusEligible && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Bonus:</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">
                    {parseFloat(bonusAmount) > 0 ? `INR ${parseFloat(bonusAmount).toLocaleString('en-IN')}` : '-'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                <span className="text-sm font-bold text-gray-900">Total Pay:</span>
                <span className="text-2xl font-bold text-primary-600">INR {parseFloat(totalPay).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">
                Base wage, bonus and total pay will show up here once you record the completed quantity this evening.
              </p>
            </div>
          )}

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
              placeholder="Additional remarks..."
            />
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
                  <span>{isEditMode ? 'Update Work Log' : 'Save & Issue Material'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/daily-work')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </form>

      <Modal
        isOpen={showAddWorker}
        onClose={() => setShowAddWorker(false)}
        title="Add Worker"
        size="sm"
      >
        <form onSubmit={handleAddWorker} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Worker Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newWorkerName}
              onChange={(e) => setNewWorkerName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              placeholder="Enter worker name"
              autoFocus
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Worker ID will be auto-generated. You can edit other details later from Workers.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={addingWorker}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all disabled:opacity-50"
            >
              {addingWorker ? 'Saving...' : 'Add Worker'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddWorker(false)}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DailyWorkEntry;
