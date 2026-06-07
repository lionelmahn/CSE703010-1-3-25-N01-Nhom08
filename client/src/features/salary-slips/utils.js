export const SLIP_STATUS_LABEL = {
  draft: 'Bản nháp',
  calculated: 'Đã tính',
  needs_recalculate: 'Cần tính lại',
  finalized: 'Đã chốt',
  none: 'Chưa lập',
};

export const SLIP_STATUS_STYLES = {
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  calculated: 'border-blue-200 bg-blue-50 text-blue-700',
  needs_recalculate: 'border-amber-200 bg-amber-50 text-amber-700',
  finalized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  none: 'border-slate-200 bg-white text-slate-500',
};

export const SLIP_AUDIT_ACTION_LABEL = {
  'salary_slip.created': 'Lập / Tính lương',
  'salary_slip.recalculated': 'Tính lại',
  'salary_slip.finalized': 'Chốt lương',
};

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));

export const yearOptions = (span = 6) => {
  const current = new Date().getFullYear();
  return Array.from({ length: span }, (_, i) => current - i);
};

export const formatVnd = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatNumber = (value, fractionDigits = 0) =>
  new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value || 0));

export const formatCoefficient = (value) => Number(value || 0).toFixed(2);

export const formatHours = (value) => `${formatCoefficient(value)} giờ`;

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

export const formatShiftTime = (start, end) => {
  const trim = (value) => (value ? String(value).slice(0, 5) : '');
  const range = [trim(start), trim(end)].filter(Boolean).join(' - ');
  return range || '-';
};

export const extractApiError = (err, fallback) =>
  err?.response?.data?.message ||
  Object.values(err?.response?.data?.errors || {})
    .flat()
    .join(' · ') ||
  fallback;
