import React from 'react';
import { STATUS_LABELS, STATUS_TONES } from '../constants';
import { TONE_CLASSES } from './ArrivalBadge';

/**
 * UC11 - Badge hien thi status lich hen voi tone tuong ung.
 */
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const label = STATUS_LABELS[status] || status;
  const tone = STATUS_TONES[status] || 'muted';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
