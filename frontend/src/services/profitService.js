// Profit Calculation Service - Phase 6
// Aggregates costs from all phases and calculates overall profit

import { rawPurchaseService } from './rawPurchaseService';
import { jobWorkService } from './jobWorkService';
import { dailyWorkService } from './dailyWorkService';
import { salesOrderService } from './salesOrderService';
import { expenseService } from './expenseService';
import { loanPaymentService } from './loanService';

export const profitService = {
  // Calculate overall profit for a given time range
  calculateProfit: async (filters = {}) => {
    try {
      // Phase 2: Raw Purchase Cost
      const rawPurchases = await rawPurchaseService.getAll(filters);
      const rawPurchaseCost = rawPurchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);

      // Phase 3: Job Work Cost
      const jobWorks = await jobWorkService.getAll(filters);
      const jobWorkCost = jobWorks.reduce((sum, j) => sum + (parseFloat(j.totalAmount) || 0), 0);

      // Phase 3: Worker Wages & Bonus
      const dailyWorks = await dailyWorkService.getAll(filters);
      const workerWagesCost = dailyWorks.reduce((sum, d) => sum + (parseFloat(d.totalPay) || 0), 0);

      // Phase 6: Expenses (excluding Loan Interest — tracked separately below)
      const expenses = await expenseService.getAll(filters);
      const nonInterestExpenses = expenses.filter(e => !e.isDeleted && e.category !== 'Loan Interest');
      const expensesCost = nonInterestExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      // Finance Charges: Loan interest paid (from loan_payments)
      let loanInterestCost = 0;
      try {
        const loanPayments = await loanPaymentService.getAll(filters);
        loanInterestCost = loanPayments.reduce((sum, p) => sum + (parseFloat(p.interestAmount) || 0), 0);
      } catch { loanInterestCost = 0; }

      // Total Cost
      const totalCost = rawPurchaseCost + jobWorkCost + workerWagesCost + expensesCost + loanInterestCost;

      // Phase 5: Total Sales Revenue
      const salesMetrics = await salesOrderService.getSummaryMetrics(filters);
      const totalSales = parseFloat(salesMetrics.totalSales) || 0;

      // Overall Profit (true profit after finance charges)
      const overallProfit = totalSales - totalCost;
      const profitMargin = totalSales > 0 ? ((overallProfit / totalSales) * 100).toFixed(2) : 0;

      return {
        // Revenue
        totalSales: totalSales.toFixed(2),

        // Costs breakdown
        rawPurchaseCost: rawPurchaseCost.toFixed(2),
        jobWorkCost: jobWorkCost.toFixed(2),
        workerWagesCost: workerWagesCost.toFixed(2),
        expensesCost: expensesCost.toFixed(2),
        loanInterestCost: loanInterestCost.toFixed(2),
        totalCost: totalCost.toFixed(2),

        // Profit
        overallProfit: overallProfit.toFixed(2),
        profitMargin: parseFloat(profitMargin),
        isProfitable: overallProfit >= 0,
      };
    } catch (error) {
      console.error('Error calculating profit:', error);
      return {
        totalSales: '0.00',
        rawPurchaseCost: '0.00',
        jobWorkCost: '0.00',
        workerWagesCost: '0.00',
        expensesCost: '0.00',
        totalCost: '0.00',
        overallProfit: '0.00',
        profitMargin: 0,
        isProfitable: false,
      };
    }
  },

  // Get detailed profit breakdown
  getProfitBreakdown: async (filters = {}) => {
    try {
      const profitData = await profitService.calculateProfit(filters);

      // Get counts for additional context
      const rawPurchases = await rawPurchaseService.getAll(filters);
      const jobWorks = await jobWorkService.getAll(filters);
      const dailyWorks = await dailyWorkService.getAll(filters);
      const expenses = await expenseService.getAll(filters);
      const salesOrders = await salesOrderService.getAll(filters);

      return {
        ...profitData,

        // Additional metrics
        counts: {
          rawPurchases: rawPurchases.length,
          jobWorks: jobWorks.length,
          dailyWorkLogs: dailyWorks.length,
          expenses: expenses.filter(e => !e.isDeleted).length,
          salesOrders: salesOrders.length,
        },

        // Cost percentages
        costBreakdown: {
          rawPurchasePercent: profitData.totalCost > 0
            ? ((parseFloat(profitData.rawPurchaseCost) / parseFloat(profitData.totalCost)) * 100).toFixed(2)
            : 0,
          jobWorkPercent: profitData.totalCost > 0
            ? ((parseFloat(profitData.jobWorkCost) / parseFloat(profitData.totalCost)) * 100).toFixed(2)
            : 0,
          workerWagesPercent: profitData.totalCost > 0
            ? ((parseFloat(profitData.workerWagesCost) / parseFloat(profitData.totalCost)) * 100).toFixed(2)
            : 0,
          expensesPercent: profitData.totalCost > 0
            ? ((parseFloat(profitData.expensesCost) / parseFloat(profitData.totalCost)) * 100).toFixed(2)
            : 0,
          loanInterestPercent: profitData.totalCost > 0
            ? ((parseFloat(profitData.loanInterestCost) / parseFloat(profitData.totalCost)) * 100).toFixed(2)
            : 0,
        },
      };
    } catch (error) {
      console.error('Error getting profit breakdown:', error);
      return {
        totalSales: '0.00',
        totalCost: '0.00',
        overallProfit: '0.00',
        profitMargin: 0,
        isProfitable: false,
        counts: {
          rawPurchases: 0,
          jobWorks: 0,
          dailyWorkLogs: 0,
          expenses: 0,
          salesOrders: 0,
        },
        costBreakdown: {
          rawPurchasePercent: 0,
          jobWorkPercent: 0,
          workerWagesPercent: 0,
          expensesPercent: 0,
        },
      };
    }
  },

  // Get profit trend (day-wise for a date range)
  getProfitTrend: async (startDate, endDate) => {
    try {
      const trend = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Loop through each day
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Calculate profit for this specific day
        const dailyProfit = await profitService.calculateProfit({
          timeRange: 'DAY',
          specificDate: dateStr,
        });

        trend.push({
          date: dateStr,
          profit: parseFloat(dailyProfit.overallProfit),
          sales: parseFloat(dailyProfit.totalSales),
          cost: parseFloat(dailyProfit.totalCost),
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return trend;
    } catch (error) {
      console.error('Error getting profit trend:', error);
      return [];
    }
  },

  // Compare profit across different time periods
  compareProfitPeriods: async () => {
    try {
      const today = await profitService.calculateProfit({ timeRange: 'DAY' });
      const thisWeek = await profitService.calculateProfit({ timeRange: 'WEEK' });
      const thisMonth = await profitService.calculateProfit({ timeRange: 'MONTH' });
      const allTime = await profitService.calculateProfit({});

      return {
        today: {
          label: 'Today',
          ...today,
        },
        thisWeek: {
          label: 'This Week',
          ...thisWeek,
        },
        thisMonth: {
          label: 'This Month',
          ...thisMonth,
        },
        allTime: {
          label: 'All Time',
          ...allTime,
        },
      };
    } catch (error) {
      console.error('Error comparing profit periods:', error);
      return {
        today: { label: 'Today', overallProfit: '0.00' },
        thisWeek: { label: 'This Week', overallProfit: '0.00' },
        thisMonth: { label: 'This Month', overallProfit: '0.00' },
        allTime: { label: 'All Time', overallProfit: '0.00' },
      };
    }
  },
};
