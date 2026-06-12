import React from 'react';
import { ROW_STATUS_LABEL, ROW_STATUS_STYLES } from '../utils';

// DR248 - trang thai tong hop cua mot bac si trong nam.
const RowStatusBadge = ({ status }) => {
  const key = ROW_STATUS_LABEL[status] ? status : 'incomplete';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold ${ROW_STATUS_STYLES[key]}`}
    >
      {ROW_STATUS_LABEL[key]}
    </span>
  );
};

export default RowStatusBadge;
