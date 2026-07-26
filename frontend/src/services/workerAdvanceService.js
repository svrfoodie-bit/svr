import { get, post, put, del } from './apiHelpers';

export const workerAdvanceService = {
  getAll: (filters = {}) => get('/worker-advances', filters),
  getById: (id) => get(`/worker-advances/${id}`),
  create: (advanceData) => post('/worker-advances', advanceData),
  update: (id, advanceData) => put(`/worker-advances/${id}`, advanceData),
  delete: (id) => del(`/worker-advances/${id}`),
  getWorkerOutstanding: (workerId) => get(`/worker-advances/worker/${workerId}/outstanding`),

  // Advances = records with status Pending or Approved
  getAllAdvances: async (filters = {}) => {
    const data = await get('/worker-advances', filters);
    return data.filter(a => a.status !== 'Settled' && a.status !== 'Cancelled');
  },

  // Settlements = records with status Settled
  getAllSettlements: async (filters = {}) => {
    const data = await get('/worker-advances', filters);
    return data.filter(a => a.status === 'Settled');
  },

  // Worker balances grouped by worker
  getAllWorkerBalances: async () => {
    const data = await get('/worker-advances');
    const balanceMap = {};
    data.forEach(a => {
      if (!balanceMap[a.workerId]) {
        balanceMap[a.workerId] = {
          workerId: a.workerId,
          workerName: a.workerName,
          totalAdvanced: 0,
          totalSettled: 0,
          balance: 0,
        };
      }
      if (a.status === 'Settled') {
        balanceMap[a.workerId].totalSettled += parseFloat(a.amount) || 0;
      } else if (a.status !== 'Cancelled') {
        balanceMap[a.workerId].totalAdvanced += parseFloat(a.amount) || 0;
      }
    });
    return Object.values(balanceMap).map(w => ({
      ...w,
      balance: w.totalAdvanced - w.totalSettled,
    }));
  },

  // Summary metrics
  getSummaryMetrics: async (filters = {}) => {
    const data = await get('/worker-advances', filters);
    const totalAdvances = data
      .filter(a => a.status !== 'Cancelled')
      .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const totalSettlements = data
      .filter(a => a.status === 'Settled')
      .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const uniqueWorkers = new Set(data.map(a => a.workerId)).size;
    return {
      totalAdvances,
      totalSettlements,
      totalOutstanding: totalAdvances - totalSettlements,
      uniqueWorkers,
    };
  },

  // Create advance record
  createAdvance: (data) => post('/worker-advances', {
    workerId: data.workerId,
    advanceDate: data.date || data.advanceDate,
    amount: data.amount,
    reason: data.remarks || data.reason || null,
    status: 'Approved',
  }),

  // Create settlement — marks existing advances as Settled
  createSettlement: async (data) => {
    const advances = await get('/worker-advances', { workerId: data.workerId });
    const pending = advances.filter(a => a.status !== 'Settled' && a.status !== 'Cancelled');
    await Promise.all(pending.map(a => put(`/worker-advances/${a.id}`, { status: 'Settled', reason: data.remarks || 'Settled' })));
    return { success: true };
  },
};
