import React from 'react';
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from '../constants';

const TONE_CLASSES = {
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  sky: 'bg-sky-50 text-sky-600 border-sky-200',
  violet: 'bg-violet-50 text-violet-600 border-violet-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

/**
 * UC7 - Badge hien thi trang thai lich hen (SR1-SR9).
 */
const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  const label = APPOINTMENT_STATUS_LABEL[status] || status || '-';
  const tone = APPOINTMENT_STATUS_TONE[status] || 'gray';
  const sizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-[11px] px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded border font-medium ${TONE_CLASSES[tone]} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
