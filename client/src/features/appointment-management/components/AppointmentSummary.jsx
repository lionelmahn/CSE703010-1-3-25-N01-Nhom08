import React from 'react';
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABEL } from '../constants';

const TONE = {
  [APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT]: 'bg-slate-50 text-slate-700 ring-slate-200',
  [APPOINTMENT_STATUS.DOCTOR_ASSIGNED]: 'bg-amber-50 text-amber-700 ring-amber-200',
  [APPOINTMENT_STATUS.CONFIRMED]: 'bg-blue-50 text-blue-700 ring-blue-200',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'bg-sky-50 text-sky-700 ring-sky-200',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-violet-50 text-violet-700 ring-violet-200',
  [APPOINTMENT_STATUS.COMPLETED]: 'bg-green-50 text-green-700 ring-green-200',
  [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-50 text-red-700 ring-red-200',
  [APPOINTMENT_STATUS.RESCHEDULED]: 'bg-amber-50 text-amber-700 ring-amber-200',
  [APPOINTMENT_STATUS.NO_SHOW]: 'bg-slate-100 text-slate-700 ring-slate-300',
};

const ORDER = [
  APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT,
  APPOINTMENT_STATUS.DOCTOR_ASSIGNED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.RESCHEDULED,
  APPOINTMENT_STATUS.NO_SHOW,
];

/**
 * UC7 - Card tom tat so luong lich hen theo trang thai (AC3).
 */
const AppointmentSummary = ({ counts = {} }) => (
  <aside className="rounded-xl border border-slate-200 bg-white p-3 lg:p-4">
    <h3 className="mb-3 text-xs font-bold text-slate-700">Tong quan trang thai</h3>
    <div className="space-y-2">
      {ORDER.map((status) => (
        <p
          key={status}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ring-1 ${TONE[status]}`}
        >
          <span className="truncate">{APPOINTMENT_STATUS_LABEL[status]}</span>
          <b className="font-bold">{counts[status] ?? 0}</b>
        </p>
      ))}
    </div>
  </aside>
);

export default AppointmentSummary;
