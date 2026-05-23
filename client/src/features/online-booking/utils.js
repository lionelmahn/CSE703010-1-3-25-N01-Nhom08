import { TIME_SLOTS } from './data';

/**
 * Định dạng ngày YYYY-MM-DD (ISO, dùng cho input type="date" và payload API).
 */
export const formatDateIso = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Định dạng dd/mm/yyyy hiển thị cho người dùng VN.
 */
export const formatDateVi = (isoDate) => {
  if (!isoDate) return '';
  const [yyyy, mm, dd] = isoDate.split('-');
  if (!yyyy || !mm || !dd) return isoDate;
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Định dạng "dd/mm/yyyy HH:mm" cho thời điểm gửi yêu cầu (DR13).
 */
export const formatDateTimeVi = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

/**
 * Số ngày kể từ "hôm nay" tới `isoDate` (làm tròn về 00:00 mỗi ngày).
 */
export const daysFromToday = (isoDate) => {
  if (!isoDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const findTimeSlot = (slotId, timeSlots = TIME_SLOTS) =>
  timeSlots.find((slot) => slot.id === slotId) || null;

/**
 * Trim + loại bỏ các pattern script/HTML thường gặp để giảm rủi ro XSS
 * trước khi gửi payload (VR13 + VR14). Phía backend bắt buộc phải làm sạch
 * lại lần nữa — phía FE chỉ là lớp phòng vệ sớm.
 */
export const sanitizeNote = (raw) => {
  if (!raw) return '';
  return String(raw)
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

export const trimOrEmpty = (value) =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Sinh mã yêu cầu local (fallback khi backend chưa cấp).
 * Định dạng: OLB + năm + số thứ tự 5 chữ số (DR1).
 */
export const generateLocalRequestCode = () => {
  const year = new Date().getFullYear();
  // Random 5 chữ số (00000 - 99999) — server sẽ thay bằng counter chính xác.
  const seq = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `OLB${year}${seq}`;
};
