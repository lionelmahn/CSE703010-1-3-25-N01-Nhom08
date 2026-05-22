/**
 * UC5 - format helpers cho ho so benh nhan.
 *
 * Tach rieng khoi component de re-use giua list, detail, dialogs.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const formatDate = (value, fallback = '-') => {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateTime = (value, fallback = '-') => {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  const date = formatDate(value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mi}`;
};

export const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const formatPhone = (value, fallback = '-') => {
  if (!value) return fallback;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length >= 9) {
    const tail = digits.slice(-7);
    const head = digits.slice(0, digits.length - 7);
    return `${head} ${tail.slice(0, 3)} ${tail.slice(3)}`.trim();
  }
  return value;
};

export const formatCurrency = (value, fallback = '0 đ') => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return `${num.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ`;
};

export const calculateAge = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
};

export const isValidVietnamPhone = (value) => {
  if (!value) return false;
  const trimmed = String(value).replace(/\s/g, '');
  return /^(\+84|84|0)[3-9][0-9]{8}$/.test(trimmed);
};

export const isValidEmail = (value) => {
  if (!value) return true; // optional
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(value).trim());
};

export const isValidIdNumber = (value) => {
  if (!value) return true;
  return /^[0-9]{9,12}$/.test(String(value).trim());
};

export const isValidDob = (value) => {
  if (!value) return true;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  // not in future, not older than 150 years
  const now = Date.now();
  const past = now - 150 * 365 * ONE_DAY_MS;
  return d.getTime() <= now && d.getTime() >= past;
};

export const buildInitials = (fullName) => {
  if (!fullName) return '?';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return `${first}${last}`.toUpperCase();
};

export const truncate = (value, limit = 40) => {
  if (!value) return '';
  const str = String(value);
  return str.length > limit ? `${str.slice(0, limit - 1)}…` : str;
};

export const sortByScore = (items = []) =>
  [...items].sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0));

export const matchScoreTone = (score) => {
  const s = Number(score) || 0;
  if (s >= 90) return 'text-green-600';
  if (s >= 80) return 'text-orange-500';
  return 'text-gray-500';
};

export const cleanPayload = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) return;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      out[key] = trimmed === '' ? null : trimmed;
    } else {
      out[key] = value;
    }
  });
  return out;
};
