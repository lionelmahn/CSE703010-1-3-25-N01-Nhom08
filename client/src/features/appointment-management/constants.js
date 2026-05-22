/**
 * UC7 - Hang so dung chung cho FE.
 *
 * STATUS phai khop voi `App\Models\Appointment::ALL_STATUSES` (server).
 */

export const APPOINTMENT_STATUS = {
  WAITING_DOCTOR_ASSIGNMENT: 'cho_phan_cong_bac_si',
  DOCTOR_ASSIGNED: 'da_phan_cong_bac_si',
  CONFIRMED: 'da_xac_nhan',
  CHECKED_IN: 'da_check_in',
  IN_PROGRESS: 'dang_kham',
  COMPLETED: 'hoan_tat',
  CANCELLED: 'da_huy',
  RESCHEDULED: 'doi_lich',
  NO_SHOW: 'khong_den',
};

export const APPOINTMENT_STATUS_LABEL = {
  [APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT]: 'Cho phan cong bac si',
  [APPOINTMENT_STATUS.DOCTOR_ASSIGNED]: 'Da phan cong bac si',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Da xac nhan',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'Da check-in',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'Dang kham',
  [APPOINTMENT_STATUS.COMPLETED]: 'Hoan tat',
  [APPOINTMENT_STATUS.CANCELLED]: 'Da huy',
  [APPOINTMENT_STATUS.RESCHEDULED]: 'Doi lich',
  [APPOINTMENT_STATUS.NO_SHOW]: 'Khong den',
};

export const APPOINTMENT_STATUS_TONE = {
  [APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT]: 'orange',
  [APPOINTMENT_STATUS.DOCTOR_ASSIGNED]: 'amber',
  [APPOINTMENT_STATUS.CONFIRMED]: 'blue',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'sky',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'violet',
  [APPOINTMENT_STATUS.COMPLETED]: 'green',
  [APPOINTMENT_STATUS.CANCELLED]: 'red',
  [APPOINTMENT_STATUS.RESCHEDULED]: 'amber',
  [APPOINTMENT_STATUS.NO_SHOW]: 'slate',
};

export const APPOINTMENT_SOURCE = {
  ONLINE: 'online',
  WALK_IN: 'tai_quay',
  PHONE: 'dien_thoai',
  FOLLOW_UP: 'tai_kham',
};

export const APPOINTMENT_SOURCE_LABEL = {
  [APPOINTMENT_SOURCE.ONLINE]: 'Online (UC6.2)',
  [APPOINTMENT_SOURCE.WALK_IN]: 'Truc tiep tai quay',
  [APPOINTMENT_SOURCE.PHONE]: 'Dien thoai',
  [APPOINTMENT_SOURCE.FOLLOW_UP]: 'Tai kham',
};

export const HISTORY_ACTION_LABEL = {
  created: 'Tao lich hen',
  updated: 'Cap nhat thong tin',
  rescheduled: 'Doi lich',
  cancelled: 'Huy lich',
  status_changed: 'Cap nhat trang thai',
};

export const DEFAULT_FILTERS = {
  status: 'all',
  branch_id: 'all',
  source: 'all',
  service_id: 'all',
  q: '',
  date: '', // YYYY-MM-DD
  date_from: '',
  date_to: '',
};

export const DEFAULT_PER_PAGE = 10;

export const DATE_PRESETS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  CUSTOM: 'custom',
};
