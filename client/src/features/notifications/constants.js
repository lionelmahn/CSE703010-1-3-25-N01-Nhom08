/**
 * UC10 - Hang so dung chung cho list/detail/filter notification.
 *
 * Cac key string khop voi backend constants tai
 * `server/app/Models/AppNotification.php`. Khi backend bo sung type/status moi,
 * cap nhat ca hai phia.
 */

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RESENT: 'resent',
};

export const NOTIFICATION_STATUS_LABEL = {
  [NOTIFICATION_STATUS.PENDING]: 'Cho gui',
  [NOTIFICATION_STATUS.SENDING]: 'Dang gui',
  [NOTIFICATION_STATUS.SENT]: 'Da gui',
  [NOTIFICATION_STATUS.FAILED]: 'That bai',
  [NOTIFICATION_STATUS.CANCELLED]: 'Da huy',
  [NOTIFICATION_STATUS.RESENT]: 'Da gui lai',
};

// Tone hop voi pattern cua OnlineBooking/Appointment.
export const NOTIFICATION_STATUS_TONE = {
  [NOTIFICATION_STATUS.PENDING]: 'amber',
  [NOTIFICATION_STATUS.SENDING]: 'blue',
  [NOTIFICATION_STATUS.SENT]: 'green',
  [NOTIFICATION_STATUS.FAILED]: 'red',
  [NOTIFICATION_STATUS.CANCELLED]: 'gray',
  [NOTIFICATION_STATUS.RESENT]: 'purple',
};

export const NOTIFICATION_TYPE = {
  REQUEST_RECEIVED: 'request_received',
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  ALTERNATIVE_PROPOSED: 'alternative_proposed',
  REQUEST_REJECTED: 'request_rejected',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  REMINDER_24H: 'reminder_24h',
  MANUAL_GENERIC: 'manual_generic',
};

export const NOTIFICATION_TYPE_LABEL = {
  [NOTIFICATION_TYPE.REQUEST_RECEIVED]: 'Da tiep nhan yeu cau',
  [NOTIFICATION_TYPE.APPOINTMENT_CONFIRMATION]: 'Xac nhan lich hen',
  [NOTIFICATION_TYPE.ALTERNATIVE_PROPOSED]: 'De xuat khung gio',
  [NOTIFICATION_TYPE.REQUEST_REJECTED]: 'Tu choi yeu cau',
  [NOTIFICATION_TYPE.APPOINTMENT_RESCHEDULED]: 'Doi lich hen',
  [NOTIFICATION_TYPE.APPOINTMENT_CANCELLED]: 'Huy lich hen',
  [NOTIFICATION_TYPE.REMINDER_24H]: 'Nhac lich 24h',
  [NOTIFICATION_TYPE.MANUAL_GENERIC]: 'Gui thu cong',
};

export const NOTIFICATION_TYPE_TONE = {
  [NOTIFICATION_TYPE.REQUEST_RECEIVED]: 'blue',
  [NOTIFICATION_TYPE.APPOINTMENT_CONFIRMATION]: 'green',
  [NOTIFICATION_TYPE.ALTERNATIVE_PROPOSED]: 'amber',
  [NOTIFICATION_TYPE.REQUEST_REJECTED]: 'red',
  [NOTIFICATION_TYPE.APPOINTMENT_RESCHEDULED]: 'blue',
  [NOTIFICATION_TYPE.APPOINTMENT_CANCELLED]: 'red',
  [NOTIFICATION_TYPE.REMINDER_24H]: 'purple',
  [NOTIFICATION_TYPE.MANUAL_GENERIC]: 'gray',
};

// Cac type duoc phep gui thu cong tu UI (manual send dialog).
export const MANUAL_DISPATCH_TYPES = [
  NOTIFICATION_TYPE.APPOINTMENT_CONFIRMATION,
  NOTIFICATION_TYPE.ALTERNATIVE_PROPOSED,
  NOTIFICATION_TYPE.REQUEST_REJECTED,
  NOTIFICATION_TYPE.APPOINTMENT_RESCHEDULED,
  NOTIFICATION_TYPE.APPOINTMENT_CANCELLED,
  NOTIFICATION_TYPE.REMINDER_24H,
  NOTIFICATION_TYPE.MANUAL_GENERIC,
];

export const CHANNEL = {
  EMAIL: 'email',
  SMS: 'sms',
  ZALO: 'zalo',
  PUSH: 'push',
};

export const CHANNEL_LABEL = {
  [CHANNEL.EMAIL]: 'Email',
  [CHANNEL.SMS]: 'SMS',
  [CHANNEL.ZALO]: 'Zalo',
  [CHANNEL.PUSH]: 'Push',
};

export const SOURCE = {
  AUTO_EVENT: 'auto_event',
  MANUAL_DISPATCH: 'manual_dispatch',
  MANUAL_RESEND: 'manual_resend',
  CRON_REMINDER: 'cron_reminder',
};

export const SOURCE_LABEL = {
  [SOURCE.AUTO_EVENT]: 'Tu dong',
  [SOURCE.MANUAL_DISPATCH]: 'Gui thu cong',
  [SOURCE.MANUAL_RESEND]: 'Gui lai thu cong',
  [SOURCE.CRON_REMINDER]: 'Nhac lich (cron)',
};

export const EVENT_LABEL = {
  queued: 'Da xep hang',
  scheduled: 'Da lap lich',
  sending: 'Dang gui',
  sent: 'Da gui',
  failed: 'That bai',
  cancelled: 'Da huy',
  resend_requested: 'Yeu cau gui lai',
  retry: 'Thu lai',
  rescheduled: 'Doi gio gui',
};

export const DEFAULT_FILTERS = {
  status: 'all',
  type: 'all',
  channel: 'all',
  source: 'all',
  appointment_id: '',
  online_booking_request_id: '',
  patient_id: '',
  date_from: '',
  date_to: '',
  q: '',
};

export const DEFAULT_PER_PAGE = 15;

export const STATUS_TAB_ORDER = [
  'all',
  NOTIFICATION_STATUS.FAILED,
  NOTIFICATION_STATUS.PENDING,
  NOTIFICATION_STATUS.SENDING,
  NOTIFICATION_STATUS.SENT,
  NOTIFICATION_STATUS.CANCELLED,
];

export const STATUS_TAB_LABEL = {
  all: 'Tat ca',
  [NOTIFICATION_STATUS.FAILED]: 'That bai',
  [NOTIFICATION_STATUS.PENDING]: 'Cho gui',
  [NOTIFICATION_STATUS.SENDING]: 'Dang gui',
  [NOTIFICATION_STATUS.SENT]: 'Da gui',
  [NOTIFICATION_STATUS.CANCELLED]: 'Da huy',
};
