export const PROCESSING_LEVEL_OPTIONS = [
  { value: 'thong_thuong', label: 'Thông thường', min: 0, max: 0, defaultValue: 0 },
  { value: 'kho', label: 'Khó', min: 0.1, max: 0.2, defaultValue: 0.1 },
  { value: 'phuc_tap', label: 'Phức tạp', min: 0.3, max: 0.4, defaultValue: 0.3 },
  { value: 'rat_phuc_tap', label: 'Rất phức tạp', min: 0.5, max: 0.5, defaultValue: 0.5 },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'upcoming', label: 'Chưa áp dụng' },
  { value: 'active', label: 'Đang áp dụng' },
  { value: 'expired', label: 'Hết hiệu lực' },
  { value: 'stopped', label: 'Ngừng áp dụng' },
];

export const CHANGE_REASON_OPTIONS = [
  { value: 'initial_setup', label: 'Thiết lập ban đầu' },
  { value: 'policy_change', label: 'Điều chỉnh chính sách' },
  { value: 'service_update', label: 'Cập nhật dịch vụ' },
  { value: 'correction', label: 'Điều chỉnh sai sót' },
];
