/**
 * Cuộn xuống section đặt lịch (BookingCTASection - id="dat-lich") thay vì
 * điều hướng sang `/booking`. Dùng cho tất cả các nút "Đặt lịch khám",
 * "Đặt lịch ngay", "Đặt lịch với bác sĩ"... trên Landing Page.
 *
 * Nếu vì lý do nào đó section chưa render (ví dụ deep-link sai), trả về
 * `false` để caller có thể fallback (ví dụ navigate('/booking')).
 */
export const BOOKING_SECTION_ID = 'dat-lich';

export const scrollToBooking = (options = {}) => {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(BOOKING_SECTION_ID);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start', ...options });
  return true;
};

/**
 * SVG placeholder cho các ảnh ngoài (Unsplash, pravatar...) khi load thất
 * bại — tránh hiển thị icon "ảnh hỏng" mặc định của trình duyệt. Là data
 * URI inline để không cần asset.
 */
export const IMAGE_FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0%25'%20stop-color%3D'%23dbeafe'%2F%3E%3Cstop%20offset%3D'100%25'%20stop-color%3D'%23bfdbfe'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'800'%20height%3D'600'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'none'%20stroke%3D'%231d4ed8'%20stroke-width%3D'10'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%20transform%3D'translate(330%20220)'%3E%3Crect%20width%3D'140'%20height%3D'120'%20rx%3D'12'%2F%3E%3Ccircle%20cx%3D'48'%20cy%3D'48'%20r%3D'14'%2F%3E%3Cpath%20d%3D'M14%20104%20l30-32%2030%2024%2034-44%2032%2052z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'400'%20y%3D'420'%20text-anchor%3D'middle'%20font-family%3D'system-ui%2Csans-serif'%20font-size%3D'28'%20font-weight%3D'600'%20fill%3D'%231e3a8a'%3EDental%20Clinic%3C%2Ftext%3E%3C%2Fsvg%3E";

/**
 * onError handler — gắn vào mọi <img> ngoài để khi ảnh 404/lỗi mạng thì
 * tự đổi sang placeholder. Self-removes để tránh loop khi placeholder
 * cũng fail (lý thuyết).
 */
export const handleImgError = (event) => {
  const img = event.currentTarget;
  if (!img || img.dataset.imgFallbackApplied === '1') return;
  img.dataset.imgFallbackApplied = '1';
  img.src = IMAGE_FALLBACK;
};
