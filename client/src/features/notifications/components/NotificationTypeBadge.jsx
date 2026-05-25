import React from 'react';

import {
  NOTIFICATION_TYPE_LABEL,
  NOTIFICATION_TYPE_TONE,
} from '../constants';

const TONE_CLASSES = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
};

const NotificationTypeBadge = ({ type, size = 'sm', className = '' }) => {
  const label = NOTIFICATION_TYPE_LABEL[type] || type || '-';
  const tone = NOTIFICATION_TYPE_TONE[type] || 'gray';
  const sizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded border font-medium ${TONE_CLASSES[tone]} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  );
};

export default NotificationTypeBadge;
