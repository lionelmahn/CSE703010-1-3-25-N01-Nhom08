import React from 'react';
import { REPORT_STATUS_LABEL, REPORT_STATUS_STYLES } from '../utils';

const ReportStatusBadge = ({ status }) => {
  const key = REPORT_STATUS_LABEL[status] ? status : 'not_created';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold ${REPORT_STATUS_STYLES[key]}`}
    >
      {REPORT_STATUS_LABEL[key]}
    </span>
  );
};

export default ReportStatusBadge;
