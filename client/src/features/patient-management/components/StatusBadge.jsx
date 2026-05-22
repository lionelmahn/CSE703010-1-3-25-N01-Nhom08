import React from 'react';

import { PATIENT_STATUS_LABEL, PATIENT_STATUS_TONE } from '../constants';

/**
 * UC5 - Badge cho trang thai ho so benh nhan.
 * Tones theo HTML mockup: green / gray / slate.
 */
const TONE_CLASSES = {
  green: 'bg-green-50 text-green-700 border-green-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  const label = PATIENT_STATUS_LABEL[status] || status || '-';
  const tone = PATIENT_STATUS_TONE[status] || 'gray';
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded border font-medium ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size] || SIZE_CLASSES.sm} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
