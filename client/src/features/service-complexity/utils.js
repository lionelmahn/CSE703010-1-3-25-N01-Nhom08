import { PROCESSING_LEVEL_OPTIONS } from './constants';

export const todayInputValue = () => new Date().toISOString().slice(0, 10);

export const formatCoefficient = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
};

export const formatDate = (value) => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return String(value);
  }
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

export const levelLabel = (level) =>
  PROCESSING_LEVEL_OPTIONS.find((option) => option.value === level)?.label || level || '-';

export const levelDefault = (level) =>
  PROCESSING_LEVEL_OPTIONS.find((option) => option.value === level)?.defaultValue ?? 0;

export const serviceLabel = (service) => {
  if (!service) return '-';
  return `${service.service_code || `DV${service.id}`} - ${service.name}`;
};

export const extractApiError = (err, fallback = 'Không thể xử lý yêu cầu.') => {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) {
    const first = Object.values(data.errors)?.[0]?.[0];
    if (first) return first;
  }
  return fallback;
};

export const statusLabel = (status) => ({
  upcoming: 'Chưa áp dụng',
  active: 'Đang áp dụng',
  expired: 'Hết hiệu lực',
  stopped: 'Ngừng áp dụng',
  default: 'Thiếu cấu hình',
}[status] || status || '-');

export const statusClassName = (status) => ({
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  upcoming: 'border-blue-200 bg-blue-50 text-blue-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-600',
  stopped: 'border-rose-200 bg-rose-50 text-rose-700',
  default: 'border-amber-200 bg-amber-50 text-amber-700',
}[status] || 'border-slate-200 bg-white text-slate-700');

export const serviceStatusLabel = (status) => ({
  active: 'Đang áp dụng',
  hidden: 'Tạm ẩn',
  draft: 'Nháp',
  discontinued: 'Ngừng áp dụng',
}[status] || status || '-');

export const serviceStatusClassName = (status) => ({
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  hidden: 'border-amber-200 bg-amber-50 text-amber-700',
  draft: 'border-blue-200 bg-blue-50 text-blue-700',
  discontinued: 'border-rose-200 bg-rose-50 text-rose-700',
}[status] || 'border-slate-200 bg-white text-slate-700');
