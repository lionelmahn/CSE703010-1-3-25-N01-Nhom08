import React from 'react';
import { MONTH_STATUS_LABEL, MONTH_STATUS_STYLES } from '../utils';

const ORDER = ['finalized', 'calculated', 'draft', 'needs_recalculate', 'not_created', 'no_shifts'];

// UC19 - chu thich mau trang thai cho ma tran.
const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-2">
    {ORDER.map((key) => (
      <span
        key={key}
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${MONTH_STATUS_STYLES[key]}`}
      >
        {MONTH_STATUS_LABEL[key]}
      </span>
    ))}
  </div>
);

export default StatusLegend;
