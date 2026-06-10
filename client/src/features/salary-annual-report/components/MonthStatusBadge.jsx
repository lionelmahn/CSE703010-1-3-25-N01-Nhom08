import React from 'react';
import { MONTH_STATUS_LABEL, MONTH_STATUS_STYLES } from '../utils';

const MonthStatusBadge = ({ status }) => {
  const key = MONTH_STATUS_LABEL[status] ? status : 'no_shifts';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold ${MONTH_STATUS_STYLES[key]}`}
    >
      {MONTH_STATUS_LABEL[key]}
    </span>
  );
};

export default MonthStatusBadge;
