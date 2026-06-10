import React from 'react';
import { FileBarChart, RotateCcw } from 'lucide-react';
import DoctorSearchSelect from './DoctorSearchSelect';
import { yearOptions } from '../utils';

const selectClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'text-[11px] font-semibold text-slate-600';

// UI2/UI10 - bo loc: bac si (combobox) + nam + trang thai + Xem bao cao + Dat lai.
const AnnualReportFilters = ({
  doctor,
  year,
  status,
  options,
  selfView,
  loading,
  onSelectDoctor,
  onYearChange,
  onStatusChange,
  onApply,
  onReset,
}) => {
  const years = options.years?.length ? options.years : yearOptions(6);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {!selfView ? (
          <div className="min-w-[260px] flex-1">
            <label className={labelClass}>Bác sĩ</label>
            <div className="mt-1">
              <DoctorSearchSelect value={doctor} year={year} onSelect={onSelectDoctor} />
            </div>
          </div>
        ) : null}

        <div>
          <label className={labelClass}>Năm báo cáo</label>
          <select
            className={`${selectClass} mt-1 w-32`}
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[180px]">
          <label className={labelClass}>Trạng thái phiếu</label>
          <select
            className={`${selectClass} mt-1`}
            value={status || ''}
            onChange={(e) => onStatusChange(e.target.value || '')}
          >
            <option value="">Tất cả trạng thái</option>
            {(options.statuses || []).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-4 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <FileBarChart size={14} /> Xem báo cáo
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Đặt lại
          </button>
        </div>
      </div>
    </section>
  );
};

export default AnnualReportFilters;
