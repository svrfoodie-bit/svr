import { get, post, put, del } from './apiHelpers';

export const FINISHED_GRADES = ['Full Kaju', 'Split Kaju', '4 Pieces', '8 Pieces', 'Chura'];
export const RAW_TYPES = ['RWA', 'White'];
export const RAW_TYPE_LABELS = {
  RWA: 'Raw Cashew',
  White: 'White Cashew',
};
export const OUTPUT_GRADES_BY_RAW_TYPE = {
  RWA: ['White Cashew'],
  White: FINISHED_GRADES,
};
export const LOSS_REASONS_BY_RAW_TYPE = {
  RWA: ['Shell Loss', 'Moisture Loss', 'Breakage', 'Cleaning Loss', 'Other Loss'],
  White: ['Breakage', 'Burnt', 'Spoilage', 'Cleaning Loss', 'Other Loss'],
};
export const WASTAGE_REASONS = LOSS_REASONS_BY_RAW_TYPE.White;

export const getRawTypeLabel = (rawType) => RAW_TYPE_LABELS[rawType] || rawType;
export const getOutputGrades = (rawType) => OUTPUT_GRADES_BY_RAW_TYPE[rawType] || FINISHED_GRADES;
export const getLossReasons = (rawType) => LOSS_REASONS_BY_RAW_TYPE[rawType] || WASTAGE_REASONS;

const normalizeBatch = (b) => {
  const rawInput = parseFloat(b.rawInputQuantity) || 0;
  const totalOutput = parseFloat(b.quantity) || 0;
  const totalWastage = parseFloat(b.wastage) || (rawInput > 0 && totalOutput > 0 ? rawInput - totalOutput : 0);
  const yieldPercentage = rawInput > 0 && totalOutput > 0
    ? parseFloat(((totalOutput / rawInput) * 100).toFixed(2))
    : 0;
  return {
    ...b,
    batchId: b.batchId || b.batchNumber,
    date: b.date || b.startDate,
    rawType: b.rawType || b.grade,
    totalOutput: totalOutput > 0 ? totalOutput : null,
    totalWastage: totalWastage > 0 ? totalWastage : null,
    yieldPercentage,
    // DB uses 'In Progress' / 'Completed', page uses 'Open' / 'Closed'
    status: b.status === 'In Progress' ? 'Open' : b.status === 'Completed' ? 'Closed' : b.status,
  };
};

export const processingBatchService = {
  getAll: async (filters = {}) => {
    const data = await get('/batches', filters);
    return data.map(normalizeBatch);
  },
  getById: async (id) => {
    const data = await get(`/batches/${id}`);
    return data ? normalizeBatch(data) : null;
  },
  create: (batchData) => post('/batches', batchData),
  update: (id, batchData) => put(`/batches/${id}`, batchData),
  delete: (id) => del(`/batches/${id}`),
  getSummaryMetrics: async (filters = {}) => {
    const data = await get('/batches/summary/metrics', filters);
    return {
      totalBatches: data?.totalBatches ?? 0,
      openBatches: data?.inProgressCount ?? 0,
      closedBatches: data?.completedCount ?? 0,
      totalRawInput: data?.totalRawInput ?? 0,
      totalOutput: data?.totalOutput ?? 0,
      totalWastage: 0,
      avgYieldPercentage: data?.totalRawInput > 0
        ? ((data.totalOutput / data.totalRawInput) * 100).toFixed(1)
        : 0,
    };
  },
  getGrades: () => get('/batches/grades/list'),
  addYieldAndWastage: (id, yieldData, wastageData) => {
    const totalOutput = yieldData.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalWastage = wastageData.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    return put(`/batches/${id}`, {
      quantity: totalOutput,
      wastage: totalWastage,
      finishedGrade: yieldData.map(y => y.grade).join(', '),
      yieldItems: yieldData,
      wastageItems: wastageData,
      status: 'Completed',
    });
  },
  closeBatch: (id) => put(`/batches/${id}`, { status: 'Completed' }),
};
