import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Format số tiền sang định dạng VNĐ (Ví dụ: 12500000 → 12.500.000₫)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
};

// Kết hợp class names + merge xung dot Tailwind (vd: max-w-lg + max-w-6xl -> max-w-6xl)
export const cn = (...inputs) => twMerge(clsx(inputs));
