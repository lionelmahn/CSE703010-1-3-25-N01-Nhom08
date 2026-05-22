import { APPOINTMENT_STATUS_TONE } from '../constants';

/**
 * UC7 - Map status -> Tailwind class cho card lich hen tren calendar.
 *
 * Bam sat thiet ke HTML (border-*-300 + bg-*-50). Khac StatusBadge o cho
 * card dung mau toi hon va co border ro rang.
 */
const TONE_TO_CLASS = {
  orange: 'border-orange-300 bg-orange-50 text-slate-800',
  amber: 'border-amber-300 bg-amber-50 text-slate-800',
  blue: 'border-blue-300 bg-blue-50 text-slate-800',
  sky: 'border-sky-300 bg-sky-50 text-slate-800',
  violet: 'border-violet-300 bg-violet-50 text-slate-800',
  green: 'border-green-300 bg-green-50 text-slate-800',
  red: 'border-red-300 bg-red-50 text-slate-700 line-through',
  slate: 'border-slate-300 bg-slate-100 text-slate-600',
};

export const cardClassForStatus = (status) => {
  const tone = APPOINTMENT_STATUS_TONE[status] || 'slate';
  return TONE_TO_CLASS[tone] || TONE_TO_CLASS.slate;
};

export const formatSlotLabel = (slot) => {
  if (!slot) return '-';
  if (slot === '17-1730') return '17:00 - 17:30';
  const [a, b] = slot.split('-');
  return `${a}:00 - ${b}:00`;
};

export default cardClassForStatus;
