/**
 * Shared form validation utilities for SVR Cashew Management System.
 *
 * Usage:
 *   import { required, email, phone, positiveNumber, validate } from '../utils/validation';
 *
 *   const errors = validate(formData, {
 *     name: [required()],
 *     email: [required(), email()],
 *     amount: [required(), positiveNumber()],
 *   });
 *   if (Object.keys(errors).length > 0) { ... }
 */

// ── Individual rule factories ────────────────────────────────────────────────

export const required = (msg = 'This field is required') => (value) => {
  const v = value == null ? '' : String(value).trim();
  return v.length === 0 ? msg : null;
};

export const email = (msg = 'Enter a valid email address') => (value) => {
  if (!value) return null; // let required() handle empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? null : msg;
};

export const phone = (msg = 'Enter a valid 10-digit phone number') => (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 10 ? null : msg;
};

export const minLength = (min, msg) => (value) => {
  if (!value) return null;
  return String(value).length >= min ? null : (msg || `Minimum ${min} characters required`);
};

export const maxLength = (max, msg) => (value) => {
  if (!value) return null;
  return String(value).length <= max ? null : (msg || `Maximum ${max} characters allowed`);
};

export const positiveNumber = (msg = 'Must be a positive number') => (value) => {
  if (value === '' || value == null) return null;
  const n = parseFloat(value);
  return !isNaN(n) && n > 0 ? null : msg;
};

export const nonNegativeNumber = (msg = 'Must be 0 or greater') => (value) => {
  if (value === '' || value == null) return null;
  const n = parseFloat(value);
  return !isNaN(n) && n >= 0 ? null : msg;
};

export const gst = (msg = 'Enter a valid 15-character GST number') => (value) => {
  if (!value) return null;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(value).trim()) ? null : msg;
};

export const pan = (msg = 'Enter a valid 10-character PAN number') => (value) => {
  if (!value) return null;
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(value).trim()) ? null : msg;
};

export const pincode = (msg = 'Enter a valid 6-digit pincode') => (value) => {
  if (!value) return null;
  return /^\d{6}$/.test(String(value).trim()) ? null : msg;
};

// ── Batch validator ──────────────────────────────────────────────────────────

/**
 * Run a set of rules against a form data object.
 * Returns an object of { fieldName: firstErrorMessage }.
 *
 * @param {object} data   - Form values: { name: 'Alice', email: '' }
 * @param {object} rules  - Rule map:    { name: [required()], email: [required(), email()] }
 * @returns {object}      - Errors map:  { email: 'This field is required' }
 */
export const validate = (data, rules) => {
  const errors = {};
  for (const field of Object.keys(rules)) {
    for (const rule of rules[field]) {
      const error = rule(data[field]);
      if (error) {
        errors[field] = error;
        break; // only first error per field
      }
    }
  }
  return errors;
};
