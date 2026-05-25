import React from 'react';

import {
  NOTIFICATION_STATUS_LABEL,
  NOTIFICATION_STATUS_TONE,
} from '../constants';

/**
 * UC10 - Badge trang thai notification, theo pattern UC6.2 StatusBadge.
 */
const TONE_CLASSES = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
};

const NotificationStatusBadge = ({ status, size = 'sm', className = '' }) => {
  const label = NOTIFICATION_STATUS_LABEL[status] || status || '-';
  const tone = NOTIFICATION_STATUS_TONE[status] || 'gray';
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

export default NotificationStatusBadge;
