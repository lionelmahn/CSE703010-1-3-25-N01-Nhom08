import {
  ACTION_LABEL,
  DAY_TYPE_OPTIONS,
  SHIFT_TYPE_OPTIONS,
  STATUS_LABEL,
  STATUS_STYLES,
} from './constants';

export const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value || '-';

export const dayTypeLabel = (value) => optionLabel(DAY_TYPE_OPTIONS, value);

export const shiftTypeLabel = (value) => optionLabel(SHIFT_TYPE_OPTIONS, value);

export const actionLabel = (value) => ACTION_LABEL[value] || value || '-';

export const statusLabel = (value) => STATUS_LABEL[value] || value || '-';

export const statusClassName = (value) => STATUS_STYLES[value] || 'border-slate-200 bg-slate-100 text-slate-600';

export const formatCoefficient = (value) => Number(value || 0).toFixed(2);

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const todayInputValue = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const sortCoefficientsAsc = (rows = []) =>
  [...rows].sort((a, b) => new Date(a.effective_from || a.created_at) - new Date(b.effective_from || b.created_at));

export const sortCoefficientsDesc = (rows = []) =>
  [...rows].sort((a, b) => new Date(b.effective_from || b.created_at) - new Date(a.effective_from || a.created_at));

export const versionLabel = (rows = [], row) => {
  if (!row) return '-';
  const group = sortCoefficientsAsc(
    rows.filter((item) => item.day_type === row.day_type && item.shift_type === row.shift_type),
  );
  const index = group.findIndex((item) => item.id === row.id);
  return `V${index >= 0 ? index + 1 : row.id}`;
};

const parseRangeStart = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseRangeEnd = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

const rangesOverlap = (leftStart, leftEnd, rightStart, rightEnd) => {
  const leftMax = leftEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightMax = rightEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  return leftStart.getTime() <= rightMax && rightStart.getTime() <= leftMax;
};

export const findLocalOverlap = (rows = [], payload) => {
  const newStart = parseRangeStart(payload?.effective_from);
  if (!newStart) return null;

  const newEnd = parseRangeEnd(payload?.effective_to);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (rows || []).find((row) => {
    if (!['active', 'upcoming'].includes(row.status)) return false;
    if (row.day_type !== payload.day_type || row.shift_type !== payload.shift_type) return false;

    const rowStart = parseRangeStart(row.effective_from);
    if (!rowStart) return false;

    const rowEnd = parseRangeEnd(row.effective_to);
    const canBeCappedByBackend =
      row.status === 'active' &&
      !row.effective_to &&
      rowStart.getTime() < newStart.getTime() &&
      rowStart.getTime() <= today.getTime();

    if (canBeCappedByBackend) return false;

    return rangesOverlap(newStart, newEnd, rowStart, rowEnd);
  });
};

export const extractApiError = (err, fallback) =>
  err?.response?.data?.message ||
  Object.values(err?.response?.data?.errors || {}).flat().join(' · ') ||
  fallback;

export const hasOverlapError = (err) => {
  const errors = err?.response?.data?.errors || {};
  const message = err?.response?.data?.message || '';
  return Boolean(errors.effective_from || /trùng|overlap|chồng|conflict/i.test(message));
};
