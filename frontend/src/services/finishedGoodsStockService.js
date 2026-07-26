import { get, post } from './apiHelpers';
import { FINISHED_GRADES } from './processingBatchService';

export const finishedGoodsStockService = {
  getAllEntries: (filters = {}) => get('/finished-goods', filters),
  getStockSummary: () => get('/finished-goods/summary'),
  getGradeStock: (grade) => get(`/finished-goods/${encodeURIComponent(grade)}/stock`),
  recordAdjustment: (adjustmentData) => post('/finished-goods/adjustment', adjustmentData),
  getAllAdjustments: (filters = {}) => get('/finished-goods/adjustments', filters),
  getStockGradeListing: () => FINISHED_GRADES,

  // Add finished goods stock entries from a closed batch
  addStockFromBatch: async (batchId, date, yieldItems) => {
    await Promise.all(
      yieldItems.map(item =>
        post('/finished-goods', {
          batchId,
          grade: item.grade,
          quantity: parseFloat(item.quantity),
          dateAdded: date,
        })
      )
    );
  },
};
