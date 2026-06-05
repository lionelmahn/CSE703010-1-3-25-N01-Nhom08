export const STATUS_LABEL = {
  upcoming: 'Sắp áp dụng',
  active: 'Đang áp dụng',
  expired: 'Hết hiệu lực',
  stopped: 'Đã dừng',
};

export const STATUS_STYLES = {
  upcoming: 'border-violet-200 bg-violet-50 text-violet-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-600',
  stopped: 'border-red-200 bg-red-50 text-red-700',
};

export const STATUS_DOT_STYLES = {
  upcoming: 'border-violet-500',
  active: 'border-emerald-500',
  expired: 'border-slate-500',
  stopped: 'border-red-500',
};

export const STATUS_TEXT_STYLES = {
  upcoming: 'text-violet-600',
  active: 'text-emerald-600',
  expired: 'text-slate-500',
  stopped: 'text-red-600',
};

export const ACTION_LABEL = {
  'hourly_rate.created': 'Tạo phiên bản',
  'hourly_rate.stopped': 'Ngừng áp dụng',
  'hourly_rate.superseded': 'Kết thúc phiên bản cũ',
};

export const CHANGE_REASON_OPTIONS = [
  { value: 'periodic_adjustment', label: 'Điều chỉnh định kỳ' },
  { value: 'salary_policy_change', label: 'Thay đổi chính sách lương' },
  { value: 'salary_frame_adjustment', label: 'Điều chỉnh theo khung lương mới' },
  { value: 'other', label: 'Khác' },
];

export const formatVnd = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatNumber = (value) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value || 0));

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

export const toDateInputValue = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const sortRatesAsc = (rates = []) =>
  [...rates].sort((a, b) => new Date(a.effective_from || a.created_at) - new Date(b.effective_from || b.created_at));

export const sortRatesDesc = (rates = []) =>
  [...rates].sort((a, b) => new Date(b.effective_from || b.created_at) - new Date(a.effective_from || a.created_at));

export const versionLabel = (rates = [], rate) => {
  if (!rate) return '-';
  const asc = sortRatesAsc(rates);
  const index = asc.findIndex((item) => item.id === rate.id);
  return `V${index >= 0 ? index + 1 : rate.id}`;
};

export const composeChangeNote = (reasonValue, detail) => {
  const reason = CHANGE_REASON_OPTIONS.find((option) => option.value === reasonValue)?.label || reasonValue || '';
  return [`Lý do thay đổi: ${reason}`, `Chi tiết lý do: ${detail || '-'}`].join('\n');
};

export const parseChangeNote = (note) => {
  if (!note) return { reason: '-', detail: '-' };

  const lines = String(note).split(/\r?\n/);
  const reasonLine = lines.find((line) => line.startsWith('Lý do thay đổi:'));
  const detailLine = lines.find((line) => line.startsWith('Chi tiết lý do:'));

  if (!reasonLine && !detailLine) {
    return { reason: '-', detail: note };
  }

  return {
    reason: reasonLine?.replace('Lý do thay đổi:', '').trim() || '-',
    detail: detailLine?.replace('Chi tiết lý do:', '').trim() || '-',
  };
};

export const calculatePercentChange = (currentValue, newValue) => {
  const current = Number(currentValue || 0);
  const next = Number(newValue || 0);
  if (!current || !Number.isFinite(current) || !Number.isFinite(next)) return null;
  return ((next - current) / current) * 100;
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

export const findLocalOverlap = (rates = [], payload) => {
  const newStart = parseRangeStart(payload?.effective_from);
  if (!newStart) return null;

  const newEnd = parseRangeEnd(payload?.effective_to);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (rates || []).find((rate) => {
    if (!['active', 'upcoming'].includes(rate.status)) return false;

    const rateStart = parseRangeStart(rate.effective_from);
    if (!rateStart) return false;

    const rateEnd = parseRangeEnd(rate.effective_to);
    const canBeCappedByBackend =
      rate.status === 'active' &&
      !rate.effective_to &&
      rateStart.getTime() < newStart.getTime() &&
      rateStart.getTime() <= today.getTime();

    if (canBeCappedByBackend) return false;

    return rangesOverlap(newStart, newEnd, rateStart, rateEnd);
  });
};

export const extractApiError = (err, fallback) =>
  err?.response?.data?.message ||
  Object.values(err?.response?.data?.errors || {}).flat().join(' · ') ||
  fallback;

export const hasOverlapError = (err) => {
  const errors = err?.response?.data?.errors || {};
  const message = err?.response?.data?.message || '';
  return Boolean(errors.effective_from || /trùng|trung|overlap|chong/i.test(message));
};
