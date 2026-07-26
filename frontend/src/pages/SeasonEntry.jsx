import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { seasonService, SEASON_STATUS } from '../services/seasonService';

const SeasonEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    targetProcurementKg: '',
    targetRevenueAmount: '',
    budgetAmount: '',
    expectedWorkers: '',
    status: 'Planned',
    notes: '',
  });

  useEffect(() => {
    if (isEdit) loadSeason();
  }, [id]);

  const loadSeason = async () => {
    try {
      const data = await seasonService.getById(id);
      setForm({
        name: data.name || '',
        startDate: data.startDate?.split('T')[0] || '',
        endDate: data.endDate?.split('T')[0] || '',
        targetProcurementKg: data.targetProcurementKg || '',
        targetRevenueAmount: data.targetRevenueAmount || '',
        budgetAmount: data.budgetAmount || '',
        expectedWorkers: data.expectedWorkers || '',
        status: data.status || 'Planned',
        notes: data.notes || '',
      });
    } catch {
      toast.error('Failed to load season');
    }
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Name, Start Date and End Date are required');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetProcurementKg: parseFloat(form.targetProcurementKg) || 0,
        targetRevenueAmount: parseFloat(form.targetRevenueAmount) || 0,
        budgetAmount: parseFloat(form.budgetAmount) || 0,
        expectedWorkers: parseInt(form.expectedWorkers) || 0,
      };
      if (isEdit) {
        await seasonService.update(id, payload);
        toast.success('Season updated');
      } else {
        await seasonService.create(payload);
        toast.success('Season created');
      }
      navigate('/season-planning');
    } catch {
      toast.error(isEdit ? 'Failed to update season' : 'Failed to create season');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, hint, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );

  const Input = ({ field, type = 'text', placeholder = '', min }) => (
    <input type={type} value={form[field]} onChange={e => set(field, e.target.value)}
      placeholder={placeholder} min={min}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/season-planning')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Season' : 'New Season Plan'}</h1>
          <p className="text-sm text-gray-600 mt-0.5">Set procurement & revenue targets for the season</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sun size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900">Season Details</h3>
          </div>

          <Field label="Season Name *">
            <Input field="name" placeholder="e.g. Kharif 2026, Main Season 2026" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date *">
              <Input field="startDate" type="date" />
            </Field>
            <Field label="End Date *">
              <Input field="endDate" type="date" />
            </Field>
          </div>

          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all">
              {SEASON_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </motion.div>

        {/* Targets */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Planning Targets</h3>

          <Field label="Target Procurement (kg)" hint="How many kg of raw cashew you plan to buy this season">
            <Input field="targetProcurementKg" type="number" placeholder="e.g. 50000" min="0" />
          </Field>

          <Field label="Target Revenue (₹)" hint="Expected total sales revenue for the season">
            <Input field="targetRevenueAmount" type="number" placeholder="e.g. 5000000" min="0" />
          </Field>

          <Field label="Total Budget (₹)" hint="Total budget for purchases, wages, and expenses">
            <Input field="budgetAmount" type="number" placeholder="e.g. 3000000" min="0" />
          </Field>

          <Field label="Expected Workers" hint="Number of workers needed during peak season">
            <Input field="expectedWorkers" type="number" placeholder="e.g. 20" min="0" />
          </Field>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this season plan..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none" />
          </Field>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/season-planning')}
            className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium">
            <Save size={16} />
            {saving ? 'Saving...' : isEdit ? 'Update Season' : 'Create Season'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SeasonEntry;
