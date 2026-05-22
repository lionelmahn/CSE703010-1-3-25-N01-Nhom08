/**
 * UC6.2 - Cac helper format / convert.
 */

import {
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  TIME_SLOTS,
} from '@/features/online-booking/data';

const padNumber = (n, len) => String(n).padStart(len, '0');

/**
 * Format ngay/gio cho UI. Tat ca input la ISO string.
 */
export const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${padNumber(d.getDate(), 2)}/${padNumber(d.getMonth() + 1, 2)}/${d.getFullYear()}`;
};

export const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${padNumber(d.getDate(), 2)}/${padNumber(d.getMonth() + 1, 2)}/${d.getFullYear()} ${padNumber(d.getHours(), 2)}:${padNumber(d.getMinutes(), 2)}`;
};

export const formatTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${padNumber(d.getHours(), 2)}:${padNumber(d.getMinutes(), 2)}`;
};

/**
 * "YYYY-MM-DD" -> "DD/MM/YYYY" (dung cho preferred_date dang date-only).
 */
export const formatDateOnly = (str) => {
  if (!str) return '-';
  const [y, m, d] = String(str).split('-');
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return phone;
};

/**
 * Resolve label tu seed config. Cho phep request co them id la chuoi tuy y
 * (vi du khach hang tu nhap "other") - fallback ve id de UI khong bi vo.
 */
export const getServiceLabel = (id) => {
  if (!id) return '-';
  const s = BOOKING_SERVICES.find((x) => x.id === id);
  return s ? s.label : id;
};

export const getServiceLabels = (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return '-';
  return ids.map(getServiceLabel).join(', ');
};

export const getBranchLabel = (id) => {
  if (!id) return '-';
  const b = CLINIC_BRANCHES.find((x) => x.id === id);
  return b ? b.label : id;
};

export const getTimeSlotLabel = (id) => {
  if (!id) return '-';
  const t = TIME_SLOTS.find((x) => x.id === id);
  if (!t) return id;
  // Bo phan "(Nghi trua)" trong UI cho gon.
  return t.label.replace(/\s*\(.*?\)\s*$/, '');
};

/**
 * Sinh code OLB202500001 tang dan dua tren id.
 */
export const generateRequestCode = (seq) => {
  const year = new Date().getFullYear();
  return `OLB${year}${padNumber(seq, 5)}`;
};

/**
 * Sinh code APT202500001 cho appointment (UC7 / BR-04).
 */
export const generateAppointmentCode = (seq) => {
  const year = new Date().getFullYear();
  return `APT${year}${padNumber(seq, 5)}`;
};

/**
 * Sinh code BN20221234 cho patient profile.
 */
export const generatePatientCode = (seq) => {
  const year = new Date().getFullYear();
  return `BN${year}${padNumber(seq, 4)}`;
};

/**
 * So sanh phone (normalize bo space/dash/dau cong dau +84).
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  let s = String(phone).replace(/[\s\-.()]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  if (s.startsWith('84') && s.length === 11) s = '0' + s.slice(2);
  return s;
};

export const sanitizeInternalNote = (text) => {
  if (!text) return '';
  // VR10: loai bo script tag tho. Khi backend that san sang nen dung server-side sanitize.
  return String(text)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .slice(0, 500);
};

/**
 * Build history entry chuan.
 */
export const buildHistoryEntry = (action, options = {}) => ({
  at: new Date().toISOString(),
  action,
  actor: options.actor || 'He thong',
  note: options.note || '',
  metadata: options.metadata || null,
});
