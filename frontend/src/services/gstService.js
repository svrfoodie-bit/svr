import { get } from './apiHelpers';

export const GST_RATE = 5;
export const CGST_RATE = 2.5;
export const SGST_RATE = 2.5;
export const HSN_CODE = '0801';

export const gstService = {
  getOutputTax: (filters = {}) => get('/gst/output-tax', filters),
  getInputTaxCredit: (filters = {}) => get('/gst/input-tax-credit', filters),
  getGSTR3BSummary: (month, year) => get('/gst/gstr3b', { month, year }),
  getHSNSummary: (month, year) => get('/gst/hsn-summary', { month, year }),
  getInvoice: (id) => get(`/gst/invoice/${id}`),
};

export const seasonService = {
  getAll: () => get('/seasons'),
  getById: (id) => get(`/seasons/${id}`),
};
