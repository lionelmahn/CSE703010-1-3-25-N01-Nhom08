/**
 * UC12 - Helpers cho UI ho so benh an.
 */

export const STATUS_LABELS = {
  cho_kham: 'Cho kham',
  dang_kham: 'Dang kham',
  nhap: 'Ban nhap',
  cho_thanh_toan: 'Cho thanh toan',
  hoan_tat: 'Da hoan tat',
  da_khoa: 'Da khoa',
  da_huy: 'Da huy',
};

export const STATUS_TONE = {
  cho_kham: 'bg-slate-100 text-slate-700 border-slate-200',
  dang_kham: 'bg-blue-50 text-blue-700 border-blue-200',
  nhap: 'bg-amber-50 text-amber-700 border-amber-200',
  cho_thanh_toan: 'bg-violet-50 text-violet-700 border-violet-200',
  hoan_tat: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  da_khoa: 'bg-rose-50 text-rose-700 border-rose-200',
  da_huy: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

export const LEVEL_LABELS = {
  thong_thuong: 'Thông thường',
  kho: 'Khó',
  phuc_tap: 'Phức tạp',
  rat_phuc_tap: 'Rất phức tạp',
};

export function formatVnd(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0 ₫';
  const n = Number(value);
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return value;
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return value;
  }
}

export function statusLabel(s) {
  return STATUS_LABELS[s] || s || '—';
}

export function statusToneClass(s) {
  return STATUS_TONE[s] || STATUS_TONE.cho_kham;
}

export function ageFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Tinh subtotal client-side de hien thi preview ngay lap tuc.
 * Server van la nguon su that.
 */
export function calcSubtotal(unitPrice, quantity, coefficient) {
  const u = Number(unitPrice) || 0;
  const q = Math.max(1, Number(quantity) || 1);
  const c = Math.max(0, Number(coefficient) || 0);
  return Math.round(u * q * (1 + c));
}
