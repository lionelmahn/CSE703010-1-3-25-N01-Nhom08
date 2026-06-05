export const DAY_TYPE_OPTIONS = [
  { value: 'weekday', label: 'Ngày thường', shortLabel: 'Ngày thường', description: 'Thứ 2 - Thứ 6' },
  { value: 'saturday', label: 'Thứ 7', shortLabel: 'Thứ 7' },
  { value: 'sunday', label: 'Chủ nhật', shortLabel: 'Chủ nhật' },
  { value: 'holiday', label: 'Ngày lễ', shortLabel: 'Ngày lễ' },
];

export const SHIFT_TYPE_OPTIONS = [
  { value: 'morning', label: 'Ca sáng' },
  { value: 'afternoon', label: 'Ca chiều' },
  { value: 'evening', label: 'Ca tối' },
  { value: 'custom', label: 'Ca tùy chỉnh' },
];

export const STATUS_LABEL = {
  upcoming: 'Sắp áp dụng',
  active: 'Đang áp dụng',
  expired: 'Hết hiệu lực',
  stopped: 'Đã dừng',
  default: 'Mặc định 1.0',
};

export const STATUS_STYLES = {
  upcoming: 'border-violet-200 bg-violet-50 text-violet-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-600',
  stopped: 'border-red-200 bg-red-50 text-red-700',
  default: 'border-amber-200 bg-amber-50 text-amber-700',
};

export const CHANGE_REASON_OPTIONS = [
  { value: 'policy_change', label: 'Thay đổi chính sách lương' },
  { value: 'periodic_adjustment', label: 'Điều chỉnh định kỳ' },
  { value: 'holiday_policy', label: 'Chính sách ngày lễ/cuối tuần' },
  { value: 'other', label: 'Khác' },
];

export const ACTION_LABEL = {
  'shift_coefficient.created': 'Tạo phiên bản',
  'shift_coefficient.stopped': 'Ngừng áp dụng',
  'shift_coefficient.superseded': 'Kết thúc phiên bản cũ',
  'shift_coefficient.default_used': 'Dùng hệ số mặc định',
};
