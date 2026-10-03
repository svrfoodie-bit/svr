const {
  calculateCashewFlowXStockTotal,
  calculateCashewFlowXBalance,
} = require('../src/utils/cashewFlowXBalance');

// The controller pulls in models -> database config, which only creates a lazy pool.
jest.mock('../src/config/database', () => ({ promisePool: { query: jest.fn() } }));
const { buildCashewFlowXActivity } = require('../src/controllers/cashewFlowX.controller');

describe('CashewFlowX stock total', () => {
  test('Total Amount = Quantity KG x Price Per KG', () => {
    expect(calculateCashewFlowXStockTotal(100, 800)).toBe(80000);
    expect(calculateCashewFlowXStockTotal(50, 750)).toBe(37500);
  });

  test('handles decimals and zero price', () => {
    expect(calculateCashewFlowXStockTotal(12.5, 799.99)).toBe(9999.88);
    expect(calculateCashewFlowXStockTotal(10, 0)).toBe(0);
  });
});

describe('CashewFlowX balance', () => {
  test('outstanding when stock exceeds payments', () => {
    expect(calculateCashewFlowXBalance({ totalStockAmount: 117500, totalPaid: 50000 })).toEqual({
      totalStockAmount: 117500,
      totalPaid: 50000,
      outstandingBalance: 67500,
      advanceAmount: 0,
      balanceStatus: 'Outstanding',
    });
  });

  test('cleared when equal', () => {
    const result = calculateCashewFlowXBalance({ totalStockAmount: 80000, totalPaid: 80000 });
    expect(result.balanceStatus).toBe('Cleared');
    expect(result.outstandingBalance).toBe(0);
    expect(result.advanceAmount).toBe(0);
  });

  test('advance when payments exceed stock (overpayment is not hidden)', () => {
    const result = calculateCashewFlowXBalance({ totalStockAmount: 80000, totalPaid: 90000 });
    expect(result.balanceStatus).toBe('Advance');
    expect(result.advanceAmount).toBe(10000);
    expect(result.outstandingBalance).toBe(0);
  });

  test('accepts DECIMAL strings from MySQL and avoids float drift', () => {
    const result = calculateCashewFlowXBalance({ totalStockAmount: '0.30', totalPaid: '0.10' });
    expect(result.outstandingBalance).toBe(0.2);
  });

  test('advance payment with no stock', () => {
    expect(calculateCashewFlowXBalance({ totalStockAmount: 0, totalPaid: 5000 }).advanceAmount).toBe(5000);
  });
});

describe('CashewFlowX activity history', () => {
  const stock = [
    { id: 1, givenDate: '2026-10-01', cashewTypeName: 'JH', quantityKg: 100, pricePerKg: 800, totalAmount: 80000, createdAt: '2026-10-01T10:00:00Z' },
    { id: 2, givenDate: '2026-10-02', cashewTypeName: 'Gundu', quantityKg: 50, pricePerKg: 750, totalAmount: 37500, createdAt: '2026-10-02T10:00:00Z' },
  ];
  const payments = [
    { id: 1, paymentDate: '2026-10-05', paymentMode: 'Cash', paymentAmount: 30000, createdAt: '2026-10-05T10:00:00Z' },
    { id: 2, paymentDate: '2026-10-10', paymentMode: 'UPI', referenceNumber: 'UTR123', paymentAmount: 20000, createdAt: '2026-10-10T10:00:00Z' },
  ];

  test('merges stock and payments newest first with a running balance', () => {
    const activity = buildCashewFlowXActivity(stock, payments);
    expect(activity.map((a) => a.activityLabel)).toEqual([
      'Payment Received', 'Payment Received', 'Stock Given', 'Stock Given',
    ]);
    expect(activity.map((a) => a.amount)).toEqual([-20000, -30000, 37500, 80000]);
    expect(activity.map((a) => a.runningBalance)).toEqual([67500, 87500, 117500, 80000]);
    expect(activity[0].details).toBe('UPI (Ref: UTR123)');
    expect(activity[3].details).toBe('JH - 100 KG @ ₹800/KG');
  });
});
