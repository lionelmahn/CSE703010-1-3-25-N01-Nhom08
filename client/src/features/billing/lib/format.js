/**
 * UC13 - Helpers UI billing.
 */

import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONE,
  PAYMENT_METHOD_LABELS,
} from '../constants';

export function formatVnd(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0 ₫';
  const n = Number(value);
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
}

/** Format used inside an input that strips spaces and currency. */
export function formatNumberInput(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return new Intl.NumberFormat('vi-VN').format(Math.round(n));
}

/** Parse "1.234.567" back to 1234567. */
export function parseNumberInput(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).replace(/[^0-9]/g, '');
  if (!str) return 0;
  return Number(str);
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return value;
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return value;
  }
}

export function invoiceStatusLabel(status) {
  return INVOICE_STATUS_LABELS[status] || status || '—';
}

export function invoiceStatusToneClass(status) {
  return INVOICE_STATUS_TONE[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || method || '—';
}
