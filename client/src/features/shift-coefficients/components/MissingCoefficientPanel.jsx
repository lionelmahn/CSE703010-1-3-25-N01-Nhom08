import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DAY_TYPE_OPTIONS, SHIFT_TYPE_OPTIONS } from '../constants';
import { dayTypeLabel, shiftTypeLabel } from '../utils';

const MissingCoefficientPanel = ({ data, onCreate }) => {
  if (!data) return null;

  const matrix = data?.matrix || {};
  const missing = [];

  DAY_TYPE_OPTIONS.forEach((day) => {
    SHIFT_TYPE_OPTIONS.forEach((shift) => {
      const cell = matrix?.[day.value]?.[shift.value];
      if (cell?.is_default) {
        missing.push({ day_type: day.value, shift_type: shift.value });
      }
    });
  });

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13px] font-extrabold text-amber-900">Cấu hình đang thiếu</h3>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-amber-700">
              {missing.length} ô dùng mặc định
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {missing.slice(0, 8).map((item) => (
              <button
                key={`${item.day_type}-${item.shift_type}`}
                type="button"
                onClick={() => onCreate?.(item)}
                className="rounded-md border border-amber-200 bg-white px-3 py-2 text-left text-[11px] text-amber-900 hover:bg-amber-100"
              >
                <span className="block font-bold">{dayTypeLabel(item.day_type)}</span>
                <span>{shiftTypeLabel(item.shift_type)} - x1.00</span>
              </button>
            ))}
          </div>
          {missing.length === 0 && (
            <p className="mt-3 text-[12px] text-amber-800">Tất cả ô trong matrix hiện tại đã có cấu hình.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MissingCoefficientPanel;
