import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DAY_TYPE_OPTIONS, SHIFT_TYPE_OPTIONS } from '../constants';
import { formatCoefficient, statusClassName } from '../utils';

const CurrentCoefficientMatrix = ({ data, date, loading, onChangeDate, onRefresh, onCreate }) => {
  const matrix = data?.matrix || {};

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-extrabold text-slate-950">Hệ số đang hiệu lực</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Matrix theo loại ngày và ca làm việc. Ô màu vàng đang dùng hệ số mặc định 1.00.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => onChangeDate?.(event.target.value)}
            className="h-9 rounded-md border border-slate-200 px-3 text-[12px]"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Tải lại
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="min-w-[680px] w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-500">
              <th className="w-40 px-3 py-2">Loại ngày</th>
              {SHIFT_TYPE_OPTIONS.map((shift) => (
                <th key={shift.value} className="px-3 py-2 text-center">{shift.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DAY_TYPE_OPTIONS.map((day) => (
              <tr key={day.value}>
                <td className="px-3 py-3 font-bold text-slate-900">
                  <span className="block">{day.label}</span>
                  {day.description && <span className="text-[10px] font-normal text-slate-500">{day.description}</span>}
                </td>
                {SHIFT_TYPE_OPTIONS.map((shift) => {
                  const cell = matrix?.[day.value]?.[shift.value];
                  const isDefault = cell?.is_default;
                  return (
                    <td key={shift.value} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => isDefault && onCreate?.({ day_type: day.value, shift_type: shift.value })}
                        className={`min-h-14 w-full rounded-md border px-3 py-2 text-center transition ${statusClassName(cell?.status || 'default')} ${isDefault ? 'hover:bg-amber-100' : ''}`}
                        disabled={loading}
                      >
                        <span className="block text-[15px] font-extrabold">
                          x{formatCoefficient(cell?.coefficient || 1)}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase">
                          {isDefault ? 'Thiếu cấu hình' : cell?.code || 'Đang hiệu lực'}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CurrentCoefficientMatrix;
