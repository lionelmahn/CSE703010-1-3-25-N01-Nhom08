import React from 'react';
import { SLIP_STATUS_LABEL, SLIP_STATUS_STYLES } from '../utils';

const StatusBadge = ({ status }) => {
  const key = status && SLIP_STATUS_LABEL[status] ? status : 'none';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold ${SLIP_STATUS_STYLES[key]}`}
    >
      {SLIP_STATUS_LABEL[key]}
    </span>
  );
};

export default StatusBadge;
