// UC17 - tien ich rieng cho bao cao luong thang. Tai dung bo format cua UC16.
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

export const REPORT_STATUS_LABEL = {
  not_created: 'Chưa lập phiếu',
  draft: 'Bản nháp',
  calculated: 'Đã tính',
  needs_recalculate: 'Cần tính lại',
  finalized: 'Đã chốt',
};

export const REPORT_STATUS_STYLES = {
  not_created: 'border-rose-200 bg-rose-50 text-rose-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  calculated: 'border-blue-200 bg-blue-50 text-blue-700',
  needs_recalculate: 'border-amber-200 bg-amber-50 text-amber-700',
  finalized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export const REPORT_STATE = {
  empty: { label: 'Chưa có dữ liệu', style: 'border-slate-200 bg-slate-50 text-slate-500' },
  incomplete: { label: 'Chưa lập đủ phiếu', style: 'border-rose-200 bg-rose-50 text-rose-700' },
  reviewing: { label: 'Đang kiểm tra', style: 'border-amber-200 bg-amber-50 text-amber-700' },
  finalized: { label: 'Đã chốt đủ', style: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

export const BULK_RESULT_STYLES = {
  created: 'text-emerald-700',
  recalculated: 'text-blue-700',
  skipped: 'text-slate-500',
  failed: 'text-rose-700',
};

export const BULK_RESULT_LABEL = {
  created: 'Đã lập',
  recalculated: 'Đã tính lại',
  skipped: 'Bỏ qua',
  failed: 'Thất bại',
};

export const formatDash = (value, formatter) =>
  value === null || value === undefined ? '--' : formatter(value);
