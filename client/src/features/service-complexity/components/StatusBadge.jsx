import React from 'react';
import { statusClassName, statusLabel } from '../utils';

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClassName(status)}`}>
    {statusLabel(status)}
  </span>
);

export default StatusBadge;
