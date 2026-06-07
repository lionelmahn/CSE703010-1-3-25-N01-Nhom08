import React from 'react';
import { statusClassName, statusLabel } from '../utils';

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClassName(status)}`}>
    {statusLabel(status)}
  </span>
);

export default StatusBadge;
