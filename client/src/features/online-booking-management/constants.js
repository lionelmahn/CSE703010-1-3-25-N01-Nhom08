/**
 * UC6.2 - Xu ly yeu cau dat lich online.
 * Hang so dung chung cho list, detail, filter, state machine.
 *
 * Khi backend Laravel san sang co the di chuyen sang DR seed nhung tach
 * khoi UI logic.
 */

import { REQUEST_STATUS } from '@/features/online-booking/data';

export { REQUEST_STATUS } from '@/features/online-booking/data';

// Trang thai mo rong them so voi UC6.1 (CANCELED, EXPIRED).
// Tat ca khoa la string de tuong thich Laravel enum sau nay.
export const REQUEST_STATUS_LABEL = {
  [REQUEST_STATUS.PENDING]: 'Cho xu ly',
  [REQUEST_STATUS.PROCESSING]: 'Dang xu ly',
  [REQUEST_STATUS.PROPOSE_OTHER]: 'De xuat lich khac',
  [REQUEST_STATUS.APPOINTMENT_CREATED]: 'Da tao lich hen',
  [REQUEST_STATUS.REJECTED]: 'Da tu choi',
  [REQUEST_STATUS.CANCELED]: 'Da huy',
  expired: 'Qua han xu ly',
};

// Mau theo HTML mockup: orange/blue/green/red.
export const REQUEST_STATUS_TONE = {
  [REQUEST_STATUS.PENDING]: 'orange',
  [REQUEST_STATUS.PROCESSING]: 'amber',
  [REQUEST_STATUS.PROPOSE_OTHER]: 'blue',
  [REQUEST_STATUS.APPOINTMENT_CREATED]: 'green',
  [REQUEST_STATUS.REJECTED]: 'red',
  [REQUEST_STATUS.CANCELED]: 'gray',
  expired: 'gray',
};

// Cac trang thai ket thuc (terminal). VR7 / SR8 / SR9.
export const TERMINAL_STATUSES = [
  REQUEST_STATUS.APPOINTMENT_CREATED,
  REQUEST_STATUS.CANCELED,
];

// Trang thai cho phep xu ly (VR1). REJECTED chi cho admin mo lai (SR7).
export const PROCESSABLE_STATUSES = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.PROCESSING,
  REQUEST_STATUS.PROPOSE_OTHER,
];

// Email status (DR14).
export const EMAIL_STATUS = {
  NONE: 'none',
  SENT: 'sent',
  FAILED: 'failed',
  PENDING_RETRY: 'pending_retry',
};

export const EMAIL_STATUS_LABEL = {
  [EMAIL_STATUS.NONE]: 'Chua gui',
  [EMAIL_STATUS.SENT]: 'Da gui',
  [EMAIL_STATUS.FAILED]: 'Gui that bai',
  [EMAIL_STATUS.PENDING_RETRY]: 'Cho gui lai',
};

// Appointment status (cua lich hen duoc tao tu UC6.2). BR-12 / AC18.
export const APPOINTMENT_STATUS = {
  WAITING_DOCTOR_ASSIGNMENT: 'cho_phan_cong_bac_si',
};

// Filter mac dinh - mo trang la xem het tat ca request (khong gioi han pending).
// HTML mockup mac dinh select "Cho xu ly" o filter nhung de mo rong demo, mac dinh
// la 'all' va san pre-set quick filter "Cho xu ly" cho receptionist.
export const DEFAULT_FILTERS = {
  status: 'all',
  branch_id: 'all',
  service_id: 'all',
  date_from: '',
  date_to: '',
  q: '',
};

// Cac tab xu ly trong card "Xu ly yeu cau" - HTML mockup.
export const PROCESSING_TABS = {
  CONFIRM: 'confirm',
  PROPOSE: 'propose',
  REJECT: 'reject',
};

// Cac tab info benh nhan.
export const PATIENT_TABS = {
  EXISTING: 'existing',
  NEW: 'new',
};

// Action labels (cho audit history + button label).
export const ACTION_LABELS = {
  request_created: 'Tao moi yeu cau',
  request_received: 'Tiep nhan yeu cau',
  processing_started: 'Bat dau xu ly',
  patient_linked: 'Lien ket ho so benh nhan',
  patient_created: 'Tao ho so benh nhan moi',
  appointment_created: 'Tao lich hen chinh thuc',
  alternative_proposed: 'De xuat lich khac',
  request_rejected: 'Tu choi yeu cau',
  request_canceled: 'Huy yeu cau',
  request_reopened: 'Mo lai yeu cau',
  email_sent: 'Gui email phan hoi',
  email_failed: 'Gui email that bai',
  internal_note_updated: 'Cap nhat ghi chu noi bo',
};

// Reject reason presets (BR-07, VR5).
export const REJECT_REASON_PRESETS = [
  'Khung gio mong muon da het slot',
  'Khong dung pham vi dich vu phong kham',
  'Khach hang trung lap yeu cau truoc do',
  'Thong tin lien lac khong chinh xac',
  'Khac (vui long nhap chi tiet)',
];

// Lich su xu ly placeholder cho row dau tien khi seed (UI yeu cau).
export const DEVICE_PRESETS = ['Windows · Chrome', 'Android · Chrome Mobile', 'iPhone · Safari', 'macOS · Safari'];

// So request hien thi moi trang.
export const DEFAULT_PER_PAGE = 10;

// Gioi han ghi chu noi bo (VR10).
export const INTERNAL_NOTE_MAX_LENGTH = 500;
