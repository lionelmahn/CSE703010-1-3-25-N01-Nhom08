import {
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  MAX_BOOKING_DAYS_AHEAD,
  NOTE_MAX_LENGTH,
  TIME_SLOTS,
} from './data';
import { daysFromToday, findTimeSlot, sanitizeNote, trimOrEmpty } from './utils';

const PHONE_REGEX = /^(0\d{9}|\+84\d{9})$/;
// RFC-5322 lite — đủ chặt cho UI, backend sẽ kiểm tra lại.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate step 1 (Thông tin cá nhân).
 *  - VR1: Họ tên bắt buộc
 *  - VR2: SĐT bắt buộc
 *  - VR3: SĐT đúng định dạng VN
 *  - VR4: Email bắt buộc
 *  - VR5: Email đúng định dạng
 */
export const validateStep1 = (form) => {
  const errors = {};
  const name = trimOrEmpty(form.name);
  const phone = trimOrEmpty(form.phone);
  const email = trimOrEmpty(form.email);

  if (!name) {
    errors.name = 'Vui lòng nhập họ và tên';
  }

  if (!phone) {
    errors.phone = 'Vui lòng nhập số điện thoại';
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = 'Số điện thoại không hợp lệ';
  }

  if (!email) {
    errors.email = 'Vui lòng nhập email';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Email không hợp lệ';
  }

  return errors;
};

/**
 * Validate step 2 (Nhu cầu & thời gian).
 *  - VR6: Ngày >= hôm nay
 *  - VR7: Nếu ngày = hôm nay, khung giờ phải > thời điểm hiện tại
 *  - VR8: Ngày <= hôm nay + 30
 *  - VR9: Khung giờ nằm trong giờ làm việc
 *  - VR10: Khung giờ không thuộc ca nghỉ
 *  - VR11: Chọn ít nhất một dịch vụ HOẶC một nhu cầu
 *  - VR12: Ghi chú <= 500 ký tự
 *  - DR8 (E12): Dịch vụ / chi nhánh phải đang hoạt động (active)
 */
export const validateStep2 = (form) => {
  const errors = {};

  if (!form.need) {
    errors.need = 'Vui lòng chọn nhu cầu khám';
  }

  // VR11: tối thiểu một dịch vụ quan tâm.
  if (!Array.isArray(form.serviceIds) || form.serviceIds.length === 0) {
    errors.serviceIds = 'Chưa chọn dịch vụ quan tâm';
  } else {
    const inactivePicked = form.serviceIds.find((id) => {
      const svc = BOOKING_SERVICES.find((s) => s.id === id);
      return svc && svc.active === false;
    });
    if (inactivePicked) {
      const svc = BOOKING_SERVICES.find((s) => s.id === inactivePicked);
      errors.serviceIds = `Dịch vụ "${svc?.label ?? inactivePicked}" hiện đang tạm ngừng. Vui lòng chọn dịch vụ khác.`;
    }
  }

  // VR6 / VR8
  if (!form.date) {
    errors.date = 'Vui lòng chọn ngày mong muốn';
  } else {
    const diff = daysFromToday(form.date);
    if (diff === null) {
      errors.date = 'Ngày đặt lịch không hợp lệ';
    } else if (diff < 0) {
      errors.date = 'Ngày đặt lịch không hợp lệ';
    } else if (diff > MAX_BOOKING_DAYS_AHEAD) {
      errors.date = `Vượt quá phạm vi đặt lịch cho phép (tối đa ${MAX_BOOKING_DAYS_AHEAD} ngày)`;
    }
  }

  // VR9 / VR10 / VR7
  if (!form.timeSlotId) {
    errors.timeSlotId = 'Vui lòng chọn khung giờ mong muốn';
  } else {
    const slot = findTimeSlot(form.timeSlotId);
    if (!slot) {
      errors.timeSlotId = 'Khung giờ không hợp lệ';
    } else if (slot.break) {
      errors.timeSlotId = 'Khung giờ không khả dụng (ca nghỉ)';
    } else if (!isWithinWorkingHours(slot)) {
      errors.timeSlotId = 'Ngoài giờ hoạt động';
    } else if (!errors.date && form.date) {
      const diff = daysFromToday(form.date);
      if (diff === 0) {
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        if (slot.start <= minutesNow) {
          errors.timeSlotId = 'Khung giờ không hợp lệ (đã qua thời điểm hiện tại)';
        }
      }
    }
  }

  // DR8: chi nhánh bắt buộc vì hệ thống có nhiều cơ sở.
  if (!form.branchId) {
    errors.branchId = 'Vui lòng chọn chi nhánh';
  } else {
    const branch = CLINIC_BRANCHES.find((b) => b.id === form.branchId);
    if (!branch) {
      errors.branchId = 'Chi nhánh không hợp lệ';
    } else if (!branch.active) {
      errors.branchId = `Chi nhánh "${branch.label}" hiện đang tạm ngừng tiếp nhận. Vui lòng chọn chi nhánh khác.`;
    }
  }

  // VR12
  if (typeof form.note === 'string' && form.note.length > NOTE_MAX_LENGTH) {
    errors.note = `Vượt quá độ dài cho phép (tối đa ${NOTE_MAX_LENGTH} ký tự)`;
  }

  return errors;
};

/**
 * Validate step 3 (Xác nhận).
 *  - VR15: Đồng ý điều khoản xử lý dữ liệu cá nhân
 *  - VR16: Captcha hợp lệ
 */
export const validateStep3 = (form) => {
  const errors = {};
  if (!form.acceptedTerms) {
    errors.acceptedTerms = 'Vui lòng đồng ý điều khoản xử lý dữ liệu cá nhân';
  }
  if (!form.captchaVerified) {
    errors.captcha = 'Vui lòng xác thực không phải là người máy';
  }
  return errors;
};

/**
 * Validate toàn bộ trước khi submit.
 */
export const validateAll = (form) => ({
  ...validateStep1(form),
  ...validateStep2(form),
  ...validateStep3(form),
});

/**
 * Slot có nằm trong dải giờ làm việc không. Cấu hình working hours được
 * suy ra trực tiếp từ TIME_SLOTS (slot không phải break).
 */
const isWithinWorkingHours = (slot) => {
  const open = TIME_SLOTS[0]?.start ?? 8 * 60;
  const close = TIME_SLOTS[TIME_SLOTS.length - 1]?.end ?? 18 * 60;
  return slot.start >= open && slot.end <= close;
};

/**
 * Chuẩn hoá form thành payload gửi backend (Data Requirement).
 * Trim họ tên, lower-case email, sanitize ghi chú,...
 */
export const buildBookingPayload = (form, { source = 'landing_page' } = {}) => ({
  // BE Laravel chap nhan ca `name` lan `full_name`. Gui ca hai de tuong
  // thich nguoc voi mock cu va cau truc API moi.
  name: trimOrEmpty(form.name),
  full_name: trimOrEmpty(form.name),
  phone: trimOrEmpty(form.phone),
  email: trimOrEmpty(form.email).toLowerCase(),
  need: form.need || null,
  service_ids: Array.isArray(form.serviceIds) ? [...form.serviceIds] : [],
  preferred_date: form.date,
  preferred_time_slot: form.timeSlotId,
  branch_id: form.branchId,
  note: sanitizeNote(form.note),
  customer_note: sanitizeNote(form.note),
  accepted_terms: !!form.acceptedTerms,
  captcha_token: form.captchaToken || null,
  source,
  tracking: form.tracking || null,
});

export { PHONE_REGEX, EMAIL_REGEX };
