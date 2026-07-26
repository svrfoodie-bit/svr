import { rawPurchaseService } from './rawPurchaseService';
import { jobWorkService } from './jobWorkService';
import { dailyWorkService } from './dailyWorkService';
import { salesOrderService } from './salesOrderService';
import { expenseService } from './expenseService';
import { processingBatchService } from './processingBatchService';
import { finishedGoodsStockService } from './finishedGoodsStockService';
import { supplierService } from './supplierService';
import { customerService } from './customerService';
import { loanService } from './loanService';

/**
 * Owner Dashboard Service
 * Provides owner-level consolidated metrics across all business operations
 * All data is READ-ONLY with no manual overrides
 */

const ownerDashboardService = {
  /**
   * Get comprehensive owner dashboard metrics
   * @param {Object} filters - { timeRange: 'DAY' | 'WEEK' | 'MONTH' | '' }
   * @returns {Promise<Object>} Complete dashboard data
   */
  getOwnerDashboard: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        // Fetch all data in parallel
        const [
          financialMetrics,
          operationsMetrics,
          cashFlowMetrics,
          loanMetrics,
        ] = await Promise.all([
          ownerDashboardService.getFinancialMetrics(filters),
          ownerDashboardService.getOperationsMetrics(filters),
          ownerDashboardService.getCashFlowMetrics(filters),
          ownerDashboardService.getLoanMetrics(),
        ]);

        resolve({
          financial: financialMetrics,
          operations: operationsMetrics,
          cashFlow: cashFlowMetrics,
          loans: loanMetrics,
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error fetching owner dashboard:', error);
        resolve({
          financial: {},
          operations: {},
          cashFlow: {},
          error: error.message,
        });
      }
    });
  },

  /**
   * Get Financial Metrics
   * - Total Sales, Total Expenses, Total Cost, Net Profit/Loss
   */
  getFinancialMetrics: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        // Get sales metrics
        const salesMetrics = await salesOrderService.getSummaryMetrics(filters);
        const totalSales = parseFloat(salesMetrics.totalSales || 0);

        // Get all cost components
        const rawPurchases = await rawPurchaseService.getAll(filters);
        const rawPurchaseCost = rawPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0);

        const jobWorks = await jobWorkService.getAll(filters);
        const jobWorkCost = jobWorks.reduce((sum, j) => sum + parseFloat(j.totalAmount || 0), 0);

        const dailyWorks = await dailyWorkService.getAll(filters);
        const workerWagesCost = dailyWorks.reduce((sum, d) => sum + parseFloat(d.totalPay || 0), 0);

        const expenses = await expenseService.getAll(filters);
        const expensesCost = expenses
          .filter(e => !e.isDeleted)
          .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Calculate totals
        const totalCost = rawPurchaseCost + jobWorkCost + workerWagesCost;
        const totalExpenses = expensesCost;
        const netProfit = totalSales - totalCost - totalExpenses;
        const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0;

        resolve({
          totalSales: totalSales.toFixed(2),
          totalCost: totalCost.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          netProfit: netProfit.toFixed(2),
          profitMargin: parseFloat(profitMargin),
          isProfitable: netProfit >= 0,
          breakdown: {
            rawPurchaseCost: rawPurchaseCost.toFixed(2),
            jobWorkCost: jobWorkCost.toFixed(2),
            workerWagesCost: workerWagesCost.toFixed(2),
            expensesCost: expensesCost.toFixed(2),
          }
        });
      } catch (error) {
        console.error('Error calculating financial metrics:', error);
        resolve({
          totalSales: '0.00',
          totalCost: '0.00',
          totalExpenses: '0.00',
          netProfit: '0.00',
          profitMargin: 0,
          isProfitable: false,
        });
      }
    });
  },

  /**
   * Get Operations Metrics
   * - Raw Purchased (Kg), Finished Produced (Kg), Average Yield %, Total Wastage %
   */
  getOperationsMetrics: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        // Get raw purchases
        const rawPurchases = await rawPurchaseService.getAll(filters);
        const totalRawPurchased = rawPurchases.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0);

        // Get all batches to calculate yield and wastage
        const batches = await processingBatchService.getAll(filters);

        let totalRawInput = 0;
        let totalFinishedOutput = 0;
        let totalWastage = 0;
        let batchesWithYield = 0;

        batches.forEach(batch => {
          const rawInput = parseFloat(batch.rawInput || 0);
          const finishedOutput = parseFloat(batch.finishedOutput || 0);
          const wastage = parseFloat(batch.wastage || 0);

          totalRawInput += rawInput;
          totalFinishedOutput += finishedOutput;
          totalWastage += wastage;

          if (batch.yieldPercentage !== null && batch.yieldPercentage !== undefined) {
            batchesWithYield++;
          }
        });

        // Calculate averages
        const averageYield = totalRawInput > 0
          ? ((totalFinishedOutput / totalRawInput) * 100).toFixed(2)
          : 0;

        const totalWastagePercent = totalRawInput > 0
          ? ((totalWastage / totalRawInput) * 100).toFixed(2)
          : 0;

        resolve({
          totalRawPurchased: totalRawPurchased.toFixed(2),
          totalFinishedProduced: totalFinishedOutput.toFixed(2),
          averageYield: parseFloat(averageYield),
          totalWastagePercent: parseFloat(totalWastagePercent),
          totalBatches: batches.length,
          totalRawInput: totalRawInput.toFixed(2),
          totalWastageKg: totalWastage.toFixed(2),
        });
      } catch (error) {
        console.error('Error calculating operations metrics:', error);
        resolve({
          totalRawPurchased: '0.00',
          totalFinishedProduced: '0.00',
          averageYield: 0,
          totalWastagePercent: 0,
          totalBatches: 0,
        });
      }
    });
  },

  /**
   * Get Cash Flow Metrics
   * - Cash Received, Digital Received, Customer Outstanding, Supplier Outstanding
   */
  getCashFlowMetrics: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        // Get all sales orders and payments
        const salesOrders = await salesOrderService.getAll(filters);

        let cashReceived = 0;
        let digitalReceived = 0; // PhonePe + Bank
        let totalSalesAmount = 0;
        let totalAmountReceived = 0;

        salesOrders.forEach(order => {
          const orderTotal = parseFloat(order.totalAmount || 0);
          const amountPaid = parseFloat(order.amountPaid || 0);

          totalSalesAmount += orderTotal;
          totalAmountReceived += amountPaid;

          // Sum up payments by mode
          if (order.payments && Array.isArray(order.payments)) {
            order.payments.forEach(payment => {
              const amount = parseFloat(payment.amount || 0);
              if (payment.paymentMode === 'Cash') {
                cashReceived += amount;
              } else if (payment.paymentMode === 'PhonePe' || payment.paymentMode === 'Bank') {
                digitalReceived += amount;
              }
            });
          }
        });

        const customerOutstanding = totalSalesAmount - totalAmountReceived;

        // Get supplier outstanding (raw purchases)
        const rawPurchases = await rawPurchaseService.getAll(filters);
        let supplierOutstanding = 0;

        rawPurchases.forEach(purchase => {
          const total = parseFloat(purchase.totalAmount || 0);
          const paid = parseFloat(purchase.amountPaid || 0);
          const pending = total - paid;
          if (pending > 0) {
            supplierOutstanding += pending;
          }
        });

        resolve({
          cashReceived: cashReceived.toFixed(2),
          digitalReceived: digitalReceived.toFixed(2),
          totalReceived: (cashReceived + digitalReceived).toFixed(2),
          customerOutstanding: customerOutstanding.toFixed(2),
          supplierOutstanding: supplierOutstanding.toFixed(2),
          netCashFlow: (cashReceived + digitalReceived - supplierOutstanding).toFixed(2),
        });
      } catch (error) {
        console.error('Error calculating cash flow metrics:', error);
        resolve({
          cashReceived: '0.00',
          digitalReceived: '0.00',
          totalReceived: '0.00',
          customerOutstanding: '0.00',
          supplierOutstanding: '0.00',
          netCashFlow: '0.00',
        });
      }
    });
  },

  /**
   * Get Loan & Capital Metrics for owner dashboard
   */
  getLoanMetrics: async () => {
    try {
      const data = await loanService.getDashboard();
      return data;
    } catch {
      return {
        totalOutstanding: 0,
        totalBankPrincipal: 0,
        totalHandPrincipal: 0,
        totalCapital: 0,
        netPosition: 0,
        totalMonthlyInterest: 0,
        totalInterestPaid: 0,
        activeLoans: 0,
      };
    }
  },

  /**
   * Get period-wise comparison for owner dashboard
   * Shows Today, This Week, This Month, All Time metrics
   */
  getPeriodComparison: async () => {
    return new Promise(async (resolve) => {
      try {
        const [today, week, month, allTime] = await Promise.all([
          ownerDashboardService.getOwnerDashboard({ timeRange: 'DAY' }),
          ownerDashboardService.getOwnerDashboard({ timeRange: 'WEEK' }),
          ownerDashboardService.getOwnerDashboard({ timeRange: 'MONTH' }),
          ownerDashboardService.getOwnerDashboard({ timeRange: '' }),
        ]);

        resolve({
          today: { label: 'Today', ...today },
          week: { label: 'This Week', ...week },
          month: { label: 'This Month', ...month },
          allTime: { label: 'All Time', ...allTime },
        });
      } catch (error) {
        console.error('Error fetching period comparison:', error);
        resolve({});
      }
    });
  },
};

export { ownerDashboardService };
