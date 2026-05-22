/**
 * UC5 - Quan ly ho so benh nhan.
 *
 * Hang so dung chung cho list / detail / filter / state machine.
 */

export const PATIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MERGED: 'merged',
};

export const PATIENT_STATUS_LABEL = {
  [PATIENT_STATUS.ACTIVE]: 'Hoạt động',
  [PATIENT_STATUS.INACTIVE]: 'Ngừng hoạt động',
  [PATIENT_STATUS.MERGED]: 'Đã gộp',
};

export const PATIENT_STATUS_TONE = {
  [PATIENT_STATUS.ACTIVE]: 'green',
  [PATIENT_STATUS.INACTIVE]: 'gray',
  [PATIENT_STATUS.MERGED]: 'slate',
};

export const PATIENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: PATIENT_STATUS.ACTIVE, label: PATIENT_STATUS_LABEL[PATIENT_STATUS.ACTIVE] },
  { value: PATIENT_STATUS.INACTIVE, label: PATIENT_STATUS_LABEL[PATIENT_STATUS.INACTIVE] },
  { value: PATIENT_STATUS.MERGED, label: PATIENT_STATUS_LABEL[PATIENT_STATUS.MERGED] },
];

export const GENDER_OPTIONS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

export const GENDER_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  ...GENDER_OPTIONS,
];

// Nguon tiep nhan mac dinh - khop voi PatientService::DEFAULT_SOURCES.
export const DEFAULT_SOURCES = [
  'Đến trực tiếp',
  'Website',
  'Landing page',
  'Facebook',
  'Facebook Ads',
  'Zalo',
  'Zalo OA',
  'Giới thiệu',
  'Bạn bè giới thiệu',
  'Khác',
];

// Tinh trang hon nhan.
export const MARITAL_STATUS_OPTIONS = [
  { value: '', label: 'Chưa xác định' },
  { value: 'Độc thân', label: 'Độc thân' },
  { value: 'Đã kết hôn', label: 'Đã kết hôn' },
  { value: 'Ly hôn', label: 'Ly hôn' },
  { value: 'Goá', label: 'Goá' },
  { value: 'Khác', label: 'Khác' },
];

// Ly do tao trung (force) presets.
export const FORCE_REASON_PRESETS = [
  'Bệnh nhân đã đổi số điện thoại, không liên kết được với hồ sơ cũ',
  'Trùng số điện thoại nhưng là người khác trong cùng gia đình',
  'Yêu cầu tạo lại theo nguyện vọng bệnh nhân',
  'Trường hợp đặc biệt - đã xác minh trực tiếp',
  'Khác (vui lòng nhập chi tiết)',
];

export const DEFAULT_FILTERS = {
  q: '',
  status: 'all',
  source: 'all',
  gender: 'all',
  date_from: '',
  date_to: '',
};

export const DEFAULT_PER_PAGE = 10;

// Action label cho audit history.
export const ACTION_LABELS = {
  created: 'Tạo mới',
  updated: 'Cập nhật',
  deactivated: 'Ngừng hoạt động',
  reactivated: 'Mở lại hồ sơ',
  merged_secondary: 'Gộp vào hồ sơ chính',
  merged_primary: 'Nhận hồ sơ gộp',
  viewed: 'Truy cập',
  seeded: 'Tạo dữ liệu mẫu',
};

// Cac field "dinh danh" - khi doi can kiem tra trung (use case 4).
export const IDENTITY_FIELDS = ['phone', 'email', 'id_number', 'full_name', 'dob'];

// Tabs cho panel chi tiet.
export const DETAIL_TABS = {
  GENERAL: 'general',
  APPOINTMENTS: 'appointments',
  VISITS: 'visits',
  INVOICES: 'invoices',
  DEBT: 'debt',
  NOTES: 'notes',
  HISTORY: 'history',
};

// Tabs cho dialog lich su.
export const HISTORY_TABS = {
  CHANGES: 'changes',
  ACCESS: 'access',
};

// Limit ghi chu / ly do.
export const REASON_MAX_LENGTH = 255;
export const NOTE_MAX_LENGTH = 500;
