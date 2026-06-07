export const TYPE_OPTIONS = [
  { value: 'degree', label: 'Học vị' },
  { value: 'academic_title', label: 'Học hàm' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'upcoming', label: 'Chưa áp dụng' },
  { value: 'active', label: 'Đang áp dụng' },
  { value: 'expired', label: 'Hết hiệu lực' },
  { value: 'stopped', label: 'Ngừng áp dụng' },
];

export const STATUS_LABEL = {
  upcoming: 'Chưa áp dụng',
  active: 'Đang áp dụng',
  expired: 'Hết hiệu lực',
  stopped: 'Ngừng áp dụng',
  default: 'Mặc định 1.00',
};

export const STATUS_STYLES = {
  upcoming: 'border-violet-200 bg-violet-50 text-violet-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-600',
  stopped: 'border-red-200 bg-red-50 text-red-700',
  default: 'border-amber-200 bg-amber-50 text-amber-700',
};

export const CHANGE_REASON_OPTIONS = [
  { value: 'initial_setup', label: 'Thiết lập ban đầu' },
  { value: 'policy_change', label: 'Điều chỉnh chính sách lương' },
  { value: 'periodic_adjustment', label: 'Điều chỉnh định kỳ' },
  { value: 'correction', label: 'Điều chỉnh sai sót' },
  { value: 'other', label: 'Khác' },
];

export const ACTION_LABEL = {
  'doctor_qualification_coefficient.created': 'Tạo phiên bản',
  'doctor_qualification_coefficient.stopped': 'Ngừng áp dụng',
  'doctor_qualification_coefficient.superseded': 'Kết thúc phiên bản cũ',
  'doctor_qualification_coefficient.default_used': 'Dùng hệ số mặc định',
};
