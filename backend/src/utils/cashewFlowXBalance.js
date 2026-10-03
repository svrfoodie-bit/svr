/**
 * CashewFlowX balance rules — the single place balances are derived.
 *
 *   Outstanding = Total Stock Amount - Total Paid   (when stock > paid)
 *   Advance     = Total Paid - Total Stock Amount   (when paid > stock)
 *
 * Payments belong to the customer, never to a specific stock entry.
 */

// Initial payment modes. Stored as plain text on each payment, so this list
// can later move to a settings table without a schema change.
const CASHEW_FLOW_X_PAYMENT_MODES = ['Cash', 'Bank', 'UPI', 'PhonePe', 'Google Pay', 'Other'];

const CASHEW_FLOW_X_BALANCE_STATUS = {
  OUTSTANDING: 'Outstanding',
  CLEARED: 'Cleared',
  ADVANCE: 'Advance',
};

// Money is rounded to paise; quantities to grams.
const roundCashewFlowXMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;
const roundCashewFlowXKg = (value) => Math.round((Number(value) || 0) * 1000) / 1000;

const calculateCashewFlowXStockTotal = (quantityKg, pricePerKg) =>
  roundCashewFlowXMoney(Number(quantityKg) * Number(pricePerKg));

const calculateCashewFlowXBalance = ({ totalStockAmount = 0, totalPaid = 0 } = {}) => {
  const stock = roundCashewFlowXMoney(totalStockAmount);
  const paid = roundCashewFlowXMoney(totalPaid);
  const difference = roundCashewFlowXMoney(stock - paid);

  let status = CASHEW_FLOW_X_BALANCE_STATUS.CLEARED;
  if (difference > 0) status = CASHEW_FLOW_X_BALANCE_STATUS.OUTSTANDING;
  else if (difference < 0) status = CASHEW_FLOW_X_BALANCE_STATUS.ADVANCE;

  return {
    totalStockAmount: stock,
    totalPaid: paid,
    outstandingBalance: difference > 0 ? difference : 0,
    advanceAmount: difference < 0 ? -difference : 0,
    balanceStatus: status,
  };
};

module.exports = {
  CASHEW_FLOW_X_PAYMENT_MODES,
  CASHEW_FLOW_X_BALANCE_STATUS,
  roundCashewFlowXMoney,
  roundCashewFlowXKg,
  calculateCashewFlowXStockTotal,
  calculateCashewFlowXBalance,
};
