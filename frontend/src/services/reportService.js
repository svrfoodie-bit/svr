import { rawPurchaseService } from './rawPurchaseService';
import { jobWorkService } from './jobWorkService';
import { dailyWorkService } from './dailyWorkService';
import { salesOrderService } from './salesOrderService';
import { expenseService } from './expenseService';
import { processingBatchService } from './processingBatchService';
import { finishedGoodsStockService } from './finishedGoodsStockService';
import { supplierService } from './supplierService';
import { customerService } from './customerService';

/**
 * Report Service
 * Provides standard business reports and exception/risk reports
 */

const reportService = {
  // ==================== STANDARD REPORTS ====================

  /**
   * Raw Purchase Summary Report
   */
  getRawPurchaseSummary: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const purchases = await rawPurchaseService.getAll(filters);

        const summary = {
          totalPurchases: purchases.length,
          totalQuantity: purchases.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0),
          totalAmount: purchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0),
          totalPaid: purchases.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0),
          totalOutstanding: 0,
          averageRate: 0,
          data: purchases,
        };

        summary.totalOutstanding = summary.totalAmount - summary.totalPaid;
        summary.averageRate = summary.totalQuantity > 0
          ? (summary.totalAmount / summary.totalQuantity).toFixed(2)
          : 0;

        resolve(summary);
      } catch (error) {
        console.error('Error generating raw purchase summary:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Job Work Cost Report
   */
  getJobWorkCostReport: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const jobWorks = await jobWorkService.getAll(filters);

        const summary = {
          totalJobWorks: jobWorks.length,
          totalQuantity: jobWorks.reduce((sum, j) => sum + parseFloat(j.quantity || 0), 0),
          totalAmount: jobWorks.reduce((sum, j) => sum + parseFloat(j.totalAmount || 0), 0),
          averageRate: 0,
          data: jobWorks,
        };

        summary.averageRate = summary.totalQuantity > 0
          ? (summary.totalAmount / summary.totalQuantity).toFixed(2)
          : 0;

        resolve(summary);
      } catch (error) {
        console.error('Error generating job work cost report:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Worker Wage & Bonus Report
   */
  getWorkerWageBonusReport: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const dailyWorks = await dailyWorkService.getAll(filters);

        const summary = {
          totalWorkLogs: dailyWorks.length,
          totalWages: dailyWorks.reduce((sum, d) => sum + parseFloat(d.wagesAmount || 0), 0),
          totalBonus: dailyWorks.reduce((sum, d) => sum + parseFloat(d.bonusAmount || 0), 0),
          totalPay: dailyWorks.reduce((sum, d) => sum + parseFloat(d.totalPay || 0), 0),
          data: dailyWorks,
        };

        resolve(summary);
      } catch (error) {
        console.error('Error generating worker wage & bonus report:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Yield & Wastage Report
   */
  getYieldWastageReport: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const batches = await processingBatchService.getAll(filters);

        let totalRawInput = 0;
        let totalFinishedOutput = 0;
        let totalWastage = 0;

        const batchData = batches.map(batch => {
          const rawInput = parseFloat(batch.rawInput || 0);
          const finishedOutput = parseFloat(batch.finishedOutput || 0);
          const wastage = parseFloat(batch.wastage || 0);
          const yieldPercent = parseFloat(batch.yieldPercentage || 0);

          totalRawInput += rawInput;
          totalFinishedOutput += finishedOutput;
          totalWastage += wastage;

          return {
            batchNumber: batch.batchNumber,
            date: batch.startDate,
            rawInput,
            finishedOutput,
            wastage,
            yieldPercent,
          };
        });

        const summary = {
          totalBatches: batches.length,
          totalRawInput,
          totalFinishedOutput,
          totalWastage,
          averageYield: totalRawInput > 0
            ? ((totalFinishedOutput / totalRawInput) * 100).toFixed(2)
            : 0,
          wastagePercent: totalRawInput > 0
            ? ((totalWastage / totalRawInput) * 100).toFixed(2)
            : 0,
          data: batchData,
        };

        resolve(summary);
      } catch (error) {
        console.error('Error generating yield & wastage report:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Daily / Monthly Sales Report
   */
  getSalesReport: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const salesOrders = await salesOrderService.getAll(filters);

        const summary = {
          totalOrders: salesOrders.length,
          totalSales: salesOrders.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0),
          totalReceived: salesOrders.reduce((sum, s) => sum + parseFloat(s.amountPaid || 0), 0),
          totalOutstanding: 0,
          data: salesOrders,
        };

        summary.totalOutstanding = summary.totalSales - summary.totalReceived;

        resolve(summary);
      } catch (error) {
        console.error('Error generating sales report:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Customer Outstanding Report
   */
  getCustomerOutstandingReport: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const customers = await customerService.getAll();
        const salesOrders = await salesOrderService.getAll(filters);

        const customerOutstanding = {};

        salesOrders.forEach(order => {
          const customerId = order.customerId;
          const totalAmount = parseFloat(order.totalAmount || 0);
          const amountPaid = parseFloat(order.amountPaid || 0);
          const outstanding = totalAmount - amountPaid;

          if (!customerOutstanding[customerId]) {
            const customer = customers.find(c => c.id === customerId);
            customerOutstanding[customerId] = {
              customerId,
              customerName: customer?.name || 'Unknown',
              phone: customer?.phone || '',
              totalSales: 0,
              totalPaid: 0,
              totalOutstanding: 0,
              orders: [],
            };
          }

          customerOutstanding[customerId].totalSales += totalAmount;
          customerOutstanding[customerId].totalPaid += amountPaid;
          customerOutstanding[customerId].totalOutstanding += outstanding;

          if (outstanding > 0) {
            customerOutstanding[customerId].orders.push({
              orderNumber: order.orderNumber,
              date: order.orderDate,
              amount: totalAmount,
              paid: amountPaid,
              outstanding,
            });
          }
        });

        const data = Object.values(customerOutstanding)
          .filter(c => c.totalOutstanding > 0)
          .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

        resolve({
          totalCustomersWithOutstanding: data.length,
          totalOutstanding: data.reduce((sum, c) => sum + c.totalOutstanding, 0),
          data,
        });
      } catch (error) {
        console.error('Error generating customer outstanding report:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Expense Register Report
   */
  getExpenseRegister: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const expenses = await expenseService.getAll(filters);
        const activeExpenses = expenses.filter(e => !e.isDeleted);

        const summary = {
          totalExpenses: activeExpenses.length,
          totalAmount: activeExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
          cashExpenses: activeExpenses.filter(e => e.paymentMode === 'Cash').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
          phonePeExpenses: activeExpenses.filter(e => e.paymentMode === 'PhonePe').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
          bankExpenses: activeExpenses.filter(e => e.paymentMode === 'Bank').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
          data: activeExpenses,
        };

        resolve(summary);
      } catch (error) {
        console.error('Error generating expense register:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Raw Stock Balance Report
   */
  getRawStockBalance: async () => {
    return new Promise(async (resolve) => {
      try {
        // Get all raw purchases
        const purchases = await rawPurchaseService.getAll();
        const totalPurchased = purchases.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0);

        // Get all batches (raw input consumed)
        const batches = await processingBatchService.getAll();
        const totalConsumed = batches.reduce((sum, b) => sum + parseFloat(b.rawInput || 0), 0);

        // Calculate balance
        const balance = totalPurchased - totalConsumed;

        resolve({
          totalPurchased: totalPurchased.toFixed(2),
          totalConsumed: totalConsumed.toFixed(2),
          currentBalance: balance.toFixed(2),
        });
      } catch (error) {
        console.error('Error calculating raw stock balance:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Finished Goods Stock Report
   */
  getFinishedGoodsStock: async () => {
    return new Promise(async (resolve) => {
      try {
        const stock = await finishedGoodsStockService.getAll();

        const summary = {
          totalProducts: stock.length,
          totalQuantity: stock.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0),
          totalValue: stock.reduce((sum, s) => sum + (parseFloat(s.quantity || 0) * parseFloat(s.sellingPrice || 0)), 0),
          data: stock,
        };

        resolve(summary);
      } catch (error) {
        console.error('Error generating finished goods stock report:', error);
        resolve({ error: error.message });
      }
    });
  },

  // ==================== EXCEPTION & RISK REPORTS ====================

  /**
   * High Wastage Batches (Wastage > 5%)
   */
  getHighWastageBatches: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const batches = await processingBatchService.getAll(filters);

        const highWastage = batches
          .filter(batch => {
            const rawInput = parseFloat(batch.rawInput || 0);
            const wastage = parseFloat(batch.wastage || 0);
            const wastagePercent = rawInput > 0 ? (wastage / rawInput) * 100 : 0;
            return wastagePercent > 5;
          })
          .map(batch => {
            const rawInput = parseFloat(batch.rawInput || 0);
            const wastage = parseFloat(batch.wastage || 0);
            const wastagePercent = rawInput > 0 ? ((wastage / rawInput) * 100).toFixed(2) : 0;
            return {
              ...batch,
              wastagePercent,
            };
          })
          .sort((a, b) => b.wastagePercent - a.wastagePercent);

        resolve({
          count: highWastage.length,
          data: highWastage,
        });
      } catch (error) {
        console.error('Error finding high wastage batches:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Low Yield Batches (Yield < 85%)
   */
  getLowYieldBatches: async (filters = {}) => {
    return new Promise(async (resolve) => {
      try {
        const batches = await processingBatchService.getAll(filters);

        const lowYield = batches
          .filter(batch => {
            const yieldPercent = parseFloat(batch.yieldPercentage || 0);
            return yieldPercent > 0 && yieldPercent < 85;
          })
          .sort((a, b) => parseFloat(a.yieldPercentage) - parseFloat(b.yieldPercentage));

        resolve({
          count: lowYield.length,
          data: lowYield,
        });
      } catch (error) {
        console.error('Error finding low yield batches:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * High Expense Periods (Expenses > ₹50,000)
   */
  getHighExpensePeriods: async () => {
    return new Promise(async (resolve) => {
      try {
        const expenses = await expenseService.getAll();

        // Group by month
        const monthlyExpenses = {};
        expenses
          .filter(e => !e.isDeleted)
          .forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyExpenses[monthKey]) {
              monthlyExpenses[monthKey] = {
                month: monthKey,
                totalExpenses: 0,
                count: 0,
              };
            }

            monthlyExpenses[monthKey].totalExpenses += parseFloat(expense.amount || 0);
            monthlyExpenses[monthKey].count++;
          });

        const highExpense = Object.values(monthlyExpenses)
          .filter(m => m.totalExpenses > 50000)
          .sort((a, b) => b.totalExpenses - a.totalExpenses);

        resolve({
          count: highExpense.length,
          data: highExpense,
        });
      } catch (error) {
        console.error('Error finding high expense periods:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Overdue Customers (Outstanding > ₹10,000)
   */
  getOverdueCustomers: async () => {
    return new Promise(async (resolve) => {
      try {
        const outstandingReport = await reportService.getCustomerOutstandingReport();

        const overdue = outstandingReport.data
          .filter(c => c.totalOutstanding > 10000)
          .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

        resolve({
          count: overdue.length,
          totalOutstanding: overdue.reduce((sum, c) => sum + c.totalOutstanding, 0),
          data: overdue,
        });
      } catch (error) {
        console.error('Error finding overdue customers:', error);
        resolve({ error: error.message });
      }
    });
  },

  /**
   * Low Stock Alerts (Stock < 100 Kg)
   */
  getLowStockAlerts: async () => {
    return new Promise(async (resolve) => {
      try {
        const stock = await finishedGoodsStockService.getAll();

        const lowStock = stock
          .filter(s => parseFloat(s.quantity || 0) < 100)
          .sort((a, b) => parseFloat(a.quantity) - parseFloat(b.quantity));

        resolve({
          count: lowStock.length,
          data: lowStock,
        });
      } catch (error) {
        console.error('Error finding low stock alerts:', error);
        resolve({ error: error.message });
      }
    });
  },
};

export { reportService };
