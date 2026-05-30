import React from 'react';
import { formatVnd } from '../lib/format';

/**
 * UC13 - Render so tien VND. Mau tuy theo dau (am = giam tru / hoan).
 */
export default function MoneyText({ value, sign = 'auto', className = '' }) {
  const n = Number(value || 0);
  let toneClass = '';
  if (sign === 'positive' || (sign === 'auto' && n > 0)) toneClass = 'text-slate-900';
  if (sign === 'negative' || (sign === 'auto' && n < 0)) toneClass = 'text-rose-600';
  return (
    <span className={`tabular-nums ${toneClass} ${className}`}>
      {formatVnd(Math.abs(n))}
    </span>
  );
}
