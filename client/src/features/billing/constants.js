/**
 * UC13 - Constants cho UI billing.
 */

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const INVOICE_STATUS_LABELS = {
  pending: 'Chờ thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

export const INVOICE_STATUS_TONE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-sky-50 text-sky-700 border-sky-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  refunded: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ ngân hàng',
};

export const METHODS_REQUIRE_REF = ['bank_transfer', 'card'];

export const ADJUSTMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
};

export const ADJUSTMENT_TYPE_LABELS = {
  positive: 'Tăng thêm',
  negative: 'Giảm trừ',
};

export const TAB_DEFS = [
  { key: 'pending', label: 'Chờ thanh toán' },
  { key: 'partial', label: 'Thanh toán một phần' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export const DISCOUNT_REASONS = [
  'Khuyến mãi sinh nhật',
  'Thẻ thành viên VIP',
  'Khám lại trong vòng 30 ngày',
  'Khuyến mãi khác',
];

export const SURCHARGE_REASONS = [
  'Phụ phí ngoài giờ',
  'Phụ phí phòng riêng',
  'Phụ phí khác',
];

export const REFUND_REASONS = [
  'Bệnh nhân yêu cầu hủy dịch vụ',
  'Phòng khám nhập sai',
  'Sự cố không thực hiện được dịch vụ',
  'Khác',
];

export const CANCEL_REASONS = [
  'Nhập nhầm dịch vụ',
  'Bệnh nhân không tới',
  'Tách hóa đơn',
  'Khác',
];
