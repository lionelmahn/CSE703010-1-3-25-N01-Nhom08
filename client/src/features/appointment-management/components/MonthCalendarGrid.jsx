import React from 'react';
import { Loader2 } from 'lucide-react';
import { APPOINTMENT_STATUS_TONE, APPOINTMENT_STATUS_LABEL } from '../constants';

const TONE_TO_DOT = {
  orange: 'bg-orange-400',
  amber: 'bg-amber-400',
  blue: 'bg-blue-500',
  sky: 'bg-sky-400',
  violet: 'bg-violet-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
};

/**
 * UC7 - Month view: luoi 7 x N tuan. Moi o ngay show counts theo status.
 *
 * Click ngay -> doi anchor + chuyen sang Day view (caller xu ly).
 */
const MonthCalendarGrid = ({ data, loading, onDayClick }) => {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
        Dang tai lich hen...
      </div>
    );
  }
  if (!data) return null;

  const { weeks = [] } = data;
  const weekHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-[12px]">
        {weekHeaders.map((w) => (
          <div key={w} className="border-l border-slate-200 p-2 text-center font-semibold text-slate-700 first:border-l-0">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onDayClick?.(day.date)}
            className={
              'min-h-[100px] border-b border-l border-slate-200 p-2 text-left text-[12px] hover:bg-slate-50 first:border-l-0 ' +
              (day.in_month ? '' : 'bg-slate-50 text-slate-400 ') +
              (day.is_today ? 'ring-2 ring-blue-300' : '')
            }
          >
            <div className="mb-1 flex items-center justify-between">
              <span className={'font-semibold ' + (day.is_today ? 'text-blue-700' : '')}>
                {day.day_of_month}
              </span>
              {day.total > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {day.total}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {Object.entries(day.counts || {})
                .filter(([k]) => k !== '_total')
                .slice(0, 4)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-1 truncate text-[10px] text-slate-600">
                    <span
                      className={'inline-block h-1.5 w-1.5 rounded-full ' + (TONE_TO_DOT[APPOINTMENT_STATUS_TONE[status]] || 'bg-slate-400')}
                    ></span>
                    <span className="truncate">
                      {APPOINTMENT_STATUS_LABEL[status] || status}: {count}
                    </span>
                  </div>
                ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthCalendarGrid;
