import React from 'react';

/**
 * UC8 - Badge muc do phu hop bac si voi lich hen.
 * Mapping fit_label: high|medium|low -> color + nhan.
 */
const STYLE = {
  high: { className: 'bg-green-100 text-green-700 border-green-200', label: 'Phu hop cao' },
  medium: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Trung binh' },
  low: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Khong nen' },
};

const AssignmentFitBadge = ({ fitLabel, score, blockers = [] }) => {
  const cfg = STYLE[fitLabel] || STYLE.medium;
  const hardBlocker = blockers?.some?.((b) => ['no_schedule', 'on_leave', 'time_conflict'].includes(b));
  if (hardBlocker) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
        Khong kha dung
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.className}`}>
      {cfg.label}{typeof score === 'number' ? ` (${Math.round(score * 100)}%)` : ''}
    </span>
  );
};

export default AssignmentFitBadge;
