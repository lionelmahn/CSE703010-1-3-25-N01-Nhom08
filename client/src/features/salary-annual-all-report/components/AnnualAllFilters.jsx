import React from 'react';
import { Search, RotateCcw, BarChart3 } from 'lucide-react';
import { yearOptions, REPORT_STATE } from '../utils';

const selectClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'text-[11px] font-semibold text-slate-600';

// UC19 - bo loc bao cao luong nam toan bo bac si (DR227-230).
const AnnualAllFilters = ({ filters, options, reportState, onChange, onReset, onApply, loading }) => {
  const years = options.years?.length ? options.years : yearOptions(6);
  const state = reportState ? REPORT_STATE[reportState] : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid items-end gap-3 lg:grid-cols-12">
        <div className="lg:col-span-2">
          <label className={labelClass}>
            Năm báo cáo <span className="text-rose-500">*</span>
          </label>
          <select
            className={`${selectClass} mt-1`}
            value={filters.year}
            onChange={(e) => onChange({ year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="relative lg:col-span-3">
          <label className={labelClass}>Bác sĩ</label>
          <Search size={14} className="pointer-events-none absolute left-2 top-[30px] text-slate-400" />
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Tất cả bác sĩ (tên hoặc mã)"
            className={`${selectClass} mt-1 pl-7`}
          />
        </div>

        <div className="lg:col-span-3">
          <label className={labelClass}>Học hàm / Học vị</label>
          <select
            className={`${selectClass} mt-1`}
            value={filters.qualification_code || ''}
            onChange={(e) => onChange({ qualification_code: e.target.value || '' })}
          >
            <option value="">Tất cả</option>
            {(options.qualifications || []).map((q) => (
              <option key={q.code} value={q.code}>
                {q.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className={labelClass}>Trạng thái phiếu</label>
          <select
            className={`${selectClass} mt-1`}
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value || '' })}
          >
            <option value="">Tất cả trạng thái</option>
            {(options.statuses || []).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 lg:col-span-2">
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <BarChart3 size={14} /> Xem báo cáo
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Xóa lọc"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="text-[11px] text-slate-400">* Chọn năm báo cáo để xem dữ liệu.</p>
        {state ? (
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${state.style}`}
          >
            {state.label}
          </span>
        ) : null}
      </div>
    </section>
  );
};

export default AnnualAllFilters;
