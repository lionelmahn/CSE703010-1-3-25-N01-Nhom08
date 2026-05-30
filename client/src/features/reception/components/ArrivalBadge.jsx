import React from 'react';
import { ARRIVAL_FLAGS } from '../constants';

const TONE_CLASSES = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  muted: 'bg-slate-100 text-slate-600 border-slate-200',
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

/**
 * UC11 - Badge co thoi gian den (UI4 / UI7).
 */
const ArrivalBadge = ({ value, size = 'sm' }) => {
  if (!value) return null;
  const meta = ARRIVAL_FLAGS[value];
  if (!meta) return null;
  const cls = TONE_CLASSES[meta.tone] || TONE_CLASSES.muted;
  const sizeCls = size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${cls} ${sizeCls}`}>
      {meta.label}
    </span>
  );
};

export { TONE_CLASSES };
export default ArrivalBadge;
