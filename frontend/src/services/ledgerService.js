import { get } from './apiHelpers';

export const ledgerService = {
  getCustomerLedger: (customerId, filters = {}) => get(`/ledger/customer/${customerId}`, filters),
  getSupplierLedger: (supplierId, filters = {}) => get(`/ledger/supplier/${supplierId}`, filters),
  getAllCustomersOutstanding: () => get('/ledger/customers/outstanding'),
  getAllSuppliersOutstanding: () => get('/ledger/suppliers/outstanding'),
};
