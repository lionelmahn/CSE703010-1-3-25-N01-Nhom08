/**
 * Mock data cho UC6.1 - Gửi yêu cầu đặt lịch online.
 *
 * Các dataset bên dưới được dùng tạm trong khi backend Laravel chưa expose
 * endpoint `/public/online-bookings`, `/public/clinic-services`,
 * `/public/clinic-branches`. Khi API thật sẵn sàng, có thể thay thế bằng
 * dữ liệu trả về từ axios trong `onlineBookingApi.js` mà không cần đổi
 * cấu trúc page/wizard.
 */

export const SOURCE_LANDING_PAGE = 'landing_page';

export const REQUEST_STATUS = {
  PENDING: 'cho_xu_ly',
  PROCESSING: 'dang_xu_ly',
  CONFIRMED: 'da_xac_nhan',
  APPOINTMENT_CREATED: 'da_tao_lich_hen',
  PROPOSE_OTHER: 'de_xuat_lich_khac',
  REJECTED: 'da_tu_choi',
  CANCELED: 'da_huy',
};

export const REQUEST_STATUS_LABEL = {
  [REQUEST_STATUS.PENDING]: 'Chờ xử lý',
  [REQUEST_STATUS.PROCESSING]: 'Đang xử lý',
  [REQUEST_STATUS.CONFIRMED]: 'Đã xác nhận',
  [REQUEST_STATUS.APPOINTMENT_CREATED]: 'Đã tạo lịch hẹn',
  [REQUEST_STATUS.PROPOSE_OTHER]: 'Đề xuất lịch khác',
  [REQUEST_STATUS.REJECTED]: 'Đã từ chối',
  [REQUEST_STATUS.CANCELED]: 'Đã hủy',
};

// Nhu cầu thăm khám (radio - chọn duy nhất)
export const BOOKING_NEEDS = [
  { id: 'general', label: 'Tư vấn tổng quát' },
  { id: 'examination', label: 'Khám & điều trị' },
  { id: 'aesthetic', label: 'Thẩm mỹ' },
  { id: 'other', label: 'Khác' },
];

// Dịch vụ quan tâm (checkbox - có thể chọn nhiều)
export const BOOKING_SERVICES = [
  { id: 'braces', label: 'Niềng răng', active: true },
  { id: 'extraction', label: 'Nhổ răng', active: true },
  { id: 'implant', label: 'Implant', active: true },
  { id: 'endodontic', label: 'Điều trị tủy', active: true },
  { id: 'porcelain', label: 'Răng sứ', active: true },
  { id: 'scaling', label: 'Cạo vôi răng', active: true },
  { id: 'whitening', label: 'Tẩy trắng răng', active: true },
  // Ví dụ một dịch vụ bị tạm ngừng để kiểm thử A4 / E12.
  { id: 'orthognathic', label: 'Phẫu thuật chỉnh hình', active: false },
  { id: 'other', label: 'Khác', active: true },
];

// Chi nhánh phòng khám.
// Mock có nhiều cơ sở -> field "Chi nhánh" trở thành bắt buộc (DR8).
export const CLINIC_BRANCHES = [
  { id: 'q1', label: 'Chi nhánh Quận 1', active: true },
  { id: 'q3', label: 'Chi nhánh Quận 3', active: true },
  { id: 'q7', label: 'Chi nhánh Quận 7', active: true },
  // Chi nhánh tạm ngừng để kiểm thử A4 / E12.
  { id: 'thu-duc', label: 'Chi nhánh TP. Thủ Đức (tạm ngừng)', active: false },
];

/**
 * Khung giờ tiếp nhận.
 * Mỗi slot có start/end ở dạng phút trong ngày (0..1439). Dùng phút thay vì
 * "HH:mm" giúp so sánh với thời điểm hiện tại nhanh và chính xác hơn.
 *
 * Cấu hình mock này mô phỏng:
 *  - Giờ làm việc 08:00 - 17:30
 *  - Ca nghỉ trưa 12:00 - 13:00 (slot này được đánh dấu `break: true`)
 */
export const TIME_SLOTS = [
  { id: '08-09', label: '08:00 - 09:00', start: 8 * 60, end: 9 * 60, break: false },
  { id: '09-10', label: '09:00 - 10:00', start: 9 * 60, end: 10 * 60, break: false },
  { id: '10-11', label: '10:00 - 11:00', start: 10 * 60, end: 11 * 60, break: false },
  { id: '11-12', label: '11:00 - 12:00', start: 11 * 60, end: 12 * 60, break: false },
  { id: '12-13', label: '12:00 - 13:00 (Nghỉ trưa)', start: 12 * 60, end: 13 * 60, break: true },
  { id: '13-14', label: '13:00 - 14:00', start: 13 * 60, end: 14 * 60, break: false },
  { id: '14-15', label: '14:00 - 15:00', start: 14 * 60, end: 15 * 60, break: false },
  { id: '15-16', label: '15:00 - 16:00', start: 15 * 60, end: 16 * 60, break: false },
  { id: '16-17', label: '16:00 - 17:00', start: 16 * 60, end: 17 * 60, break: false },
  { id: '17-1730', label: '17:00 - 17:30', start: 17 * 60, end: 17 * 60 + 30, break: false },
];

// Số ngày tối đa được phép chọn kể từ ngày hiện tại (DR6 / VR8).
export const MAX_BOOKING_DAYS_AHEAD = 30;

// Giới hạn ký tự cho ghi chú (DR9 / VR12).
export const NOTE_MAX_LENGTH = 500;

// Trạng thái khởi tạo cho form wizard. Tách ra đây để vừa được BookingWizard
// dùng vừa được BookingPage dùng cho prefill query string mà không vướng
// react-refresh/only-export-components.
export const INITIAL_BOOKING_FORM = {
  name: '',
  phone: '',
  email: '',
  need: '',
  serviceIds: [],
  date: '',
  timeSlotId: '',
  branchId: '',
  note: '',
  acceptedTerms: false,
  captchaVerified: false,
  captchaToken: null,
  tracking: null,
};
