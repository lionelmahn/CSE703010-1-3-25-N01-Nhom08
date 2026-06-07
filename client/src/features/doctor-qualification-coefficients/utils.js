import {
  ACTION_LABEL,
  STATUS_LABEL,
  STATUS_STYLES,
  TYPE_OPTIONS,
} from './constants';

export const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value || '-';

export const typeLabel = (value) => optionLabel(TYPE_OPTIONS, value);

export const actionLabel = (value) => ACTION_LABEL[value] || value || '-';

export const statusLabel = (value) => STATUS_LABEL[value] || value || '-';

export const statusClassName = (value) => STATUS_STYLES[value] || 'border-slate-200 bg-slate-100 text-slate-600';

export const qualificationsFromOptions = (options) =>
  options?.qualifications?.length ? options.qualifications : [];

export const qualificationByCode = (qualifications = [], code) =>
  qualifications.find((item) => item.code === code);

export const qualificationLabel = (qualifications, code) =>
  qualificationByCode(qualifications, code)?.name || code || '-';

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

export const sortRows = (rows = []) =>
  [...rows].sort((a, b) => {
    const priority = Number(a.priority || 99) - Number(b.priority || 99);
    if (priority !== 0) return priority;
    const byDate = new Date(b.effective_from || b.created_at || 0) - new Date(a.effective_from || a.created_at || 0);
    if (byDate !== 0) return byDate;
    return Number(b.id || 0) - Number(a.id || 0);
  });

export const versionLabel = (rows = [], row) => {
  if (!row) return '-';
  const group = [...rows]
    .filter((item) =>
      item.qualification_code === row.qualification_code &&
      item.qualification_type === row.qualification_type)
    .sort((a, b) => new Date(a.effective_from || a.created_at || 0) - new Date(b.effective_from || b.created_at || 0));
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
    if (row.qualification_code !== payload.qualification_code) return false;
    if (row.qualification_type !== payload.qualification_type) return false;

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
