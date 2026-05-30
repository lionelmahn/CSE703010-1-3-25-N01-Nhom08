/**
 * UC11 - Hang so + label dung chung cho module reception.
 */

export const ARRIVAL_FLAGS = {
  early: { value: 'early', label: 'Den som', tone: 'info' },
  on_time: { value: 'on_time', label: 'Dung gio', tone: 'success' },
  late: { value: 'late', label: 'Den tre', tone: 'warning' },
  very_late: { value: 'very_late', label: 'Tre nhieu', tone: 'danger' },
};

export const ARRIVAL_FLAG_LIST = Object.values(ARRIVAL_FLAGS);

// Nguong (phut) so voi gio bat dau slot - dung de FE goi y arrival_flag.
export const EARLY_THRESHOLD_MIN = 10; // den truoc >=10 phut -> early
export const ON_TIME_LATE_LIMIT = 5; // den tre <=5 phut -> on_time
export const LATE_LIMIT = 15; // den tre <=15 phut -> late, > -> very_late

export const OVERDUE_WAIT_MIN = 30;

export const ARRIVAL_FILTER_TABS = [
  { value: 'all', label: 'Tat ca' },
  { value: 'upcoming', label: 'Sap den' },
  { value: 'checked_in', label: 'Da check-in' },
  { value: 'in_progress', label: 'Dang kham' },
  { value: 'other', label: 'Khac' },
];

export const QUEUE_BUCKET_LABELS = {
  unassigned: { title: 'Chua co bac si', tone: 'warning' },
  waiting: { title: 'Dang cho kham', tone: 'info' },
  ready: { title: 'San sang', tone: 'success' },
  in_progress: { title: 'Dang kham', tone: 'primary' },
};

export const QUEUE_BUCKET_ORDER = ['unassigned', 'waiting', 'ready', 'in_progress'];

export const STATUS_LABELS = {
  cho_phan_cong_bac_si: 'Cho phan cong BS',
  da_phan_cong_bac_si: 'Da phan cong BS',
  da_xac_nhan: 'Da xac nhan',
  da_check_in: 'Da check-in',
  dang_kham: 'Dang kham',
  hoan_tat: 'Hoan tat',
  da_huy: 'Da huy',
  doi_lich: 'Doi lich',
  khong_den: 'Khong den',
};

export const STATUS_TONES = {
  cho_phan_cong_bac_si: 'warning',
  da_phan_cong_bac_si: 'info',
  da_xac_nhan: 'info',
  da_check_in: 'success',
  dang_kham: 'primary',
  hoan_tat: 'success',
  da_huy: 'muted',
  doi_lich: 'muted',
  khong_den: 'danger',
};

// Fallback reasons khi API /reception/reasons chua tra ve.
export const NO_SHOW_REASONS_FALLBACK = [
  { id: 'khong_lien_lac_duoc', label: 'Khong lien lac duoc benh nhan' },
  { id: 'benh_nhan_huy_phut_chot', label: 'Benh nhan huy phut chot' },
  { id: 'qua_lau_khong_den', label: 'Qua lau khong den' },
  { id: 'khac', label: 'Khac' },
];

export const CANCEL_CHECK_IN_REASONS_FALLBACK = [
  { id: 'sai_thong_tin', label: 'Check-in nham/sai thong tin' },
  { id: 'benh_nhan_doi_y', label: 'Benh nhan doi y' },
  { id: 'doi_ngay_kham', label: 'Doi ngay/gio kham' },
  { id: 'khac', label: 'Khac' },
];

export const RECEPTION_TODAY_REFRESH_MS = 30_000;
export const RECEPTION_QUEUE_REFRESH_MS = 15_000;
