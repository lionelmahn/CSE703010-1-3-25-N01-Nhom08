// UC18 - tien ich cho bao cao luong nam cua mot bac si. Tai dung bo format UC16.
export {
  formatVnd,
  formatNumber,
  formatCoefficient,
  formatDate,
  formatDateTime,
  extractApiError,
  yearOptions,
} from '@/features/salary-slips/utils';

export { REPORT_STATE } from '@/features/salary-report/utils';

// Trang thai tung thang (gom 2 trang thai suy ra rieng cho bao cao nam).
export const MONTH_STATUS_LABEL = {
  no_shifts: 'Chưa phát sinh',
  not_created: 'Chưa lập phiếu',
  draft: 'Bản nháp',
  calculated: 'Đã tính',
  needs_recalculate: 'Cần tính lại',
  finalized: 'Đã chốt',
};

export const MONTH_STATUS_STYLES = {
  no_shifts: 'border-slate-200 bg-white text-slate-400',
  not_created: 'border-rose-200 bg-rose-50 text-rose-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  calculated: 'border-blue-200 bg-blue-50 text-blue-700',
  needs_recalculate: 'border-amber-200 bg-amber-50 text-amber-700',
  finalized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export const formatDash = (value, formatter) =>
  value === null || value === undefined ? '--' : formatter(value);
