import React from 'react';
import { STATUS_LABEL, STATUS_STYLES } from '../utils';

const StatusBadge = ({ status, compact = false }) => {
  const className = STATUS_STYLES[status] || 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-bold ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } ${className}`}
    >
      {STATUS_LABEL[status] || status || '-'}
    </span>
  );
};

export default StatusBadge;
