// UC19 - tien ich cho bao cao luong nam toan bo bac si. Tai dung bo format UC16.
export {
  formatVnd,
  formatNumber,
  formatCoefficient,
  formatDate,
  formatDateTime,
  extractApiError,
  MONTH_OPTIONS,
  yearOptions,
} from '@/features/salary-slips/utils';

export { REPORT_STATE } from '@/features/salary-report/utils';
export { MONTH_STATUS_LABEL, MONTH_STATUS_STYLES } from '@/features/salary-annual-report/utils';

// Trang thai tong hop tung dong bac si (DR248).
export const ROW_STATUS_LABEL = {
  incomplete: 'Chưa lập đủ phiếu',
  reviewing: 'Đang kiểm tra',
  needs_adjust: 'Cần điều chỉnh',
  finalized: 'Đã chốt đủ',
};

export const ROW_STATUS_STYLES = {
  incomplete: 'border-rose-200 bg-rose-50 text-rose-700',
  reviewing: 'border-amber-200 bg-amber-50 text-amber-700',
  needs_adjust: 'border-orange-200 bg-orange-50 text-orange-700',
  finalized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export const VIEW_MODES = [
  { value: 'matrix', label: 'Ma trận Bác sĩ × Tháng' },
  { value: 'doctor', label: 'Theo bác sĩ' },
  { value: 'month', label: 'Theo tháng' },
];

// Mau cho bieu do phan bo trang thai + chu thich.
export const STATUS_DIST_COLORS = {
  finalized: '#10b981',
  under_review: '#3b82f6',
  draft: '#94a3b8',
  adjusted: '#f97316',
  missing: '#f43f5e',
  no_activity: '#cbd5e1',
};

export const percent = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

export const formatDash = (value, formatter) =>
  value === null || value === undefined ? '--' : formatter(value);
