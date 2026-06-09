import React from 'react';
import { Search, RotateCcw, Download, Printer } from 'lucide-react';
import { MONTH_OPTIONS, yearOptions, REPORT_STATE } from '../utils';

const selectClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'text-[11px] font-semibold text-slate-600';

const SalaryReportFilters = ({
  filters,
  options,
  reportState,
  onChange,
  onReset,
  onExport,
  onPrint,
  canExport,
  loading,
}) => {
  const years = yearOptions(6);
  const state = reportState ? REPORT_STATE[reportState] : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Hang chinh: ky bao cao noi bat + trang thai + hanh dong */}
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 pb-4">
        <div>
          <label className={labelClass}>Tháng</label>
          <select
            className={`${selectClass} mt-1 w-28`}
            value={filters.period_month}
            onChange={(e) => onChange({ period_month: Number(e.target.value) })}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Năm</label>
          <select
            className={`${selectClass} mt-1 w-28`}
            value={filters.period_year}
            onChange={(e) => onChange({ period_year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {state ? (
          <span
            className={`mb-1 inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${state.style}`}
          >
            {state.label}
          </span>
        ) : null}

        <div className="ml-auto flex items-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Xóa lọc
          </button>
          {canExport ? (
            <>
              <button
                type="button"
                onClick={onPrint}
                disabled={loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Printer size={14} /> In
              </button>
              <button
                type="button"
                onClick={onExport}
                disabled={loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Download size={14} /> Xuất báo cáo
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Bo loc nang cao */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <label className={labelClass}>Tìm bác sĩ</label>
          <Search size={14} className="pointer-events-none absolute left-2 top-[30px] text-slate-400" />
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Tên hoặc mã bác sĩ"
            className={`${selectClass} mt-1 pl-7`}
          />
        </div>
        <div>
          <label className={labelClass}>Chi nhánh</label>
          <select
            className={`${selectClass} mt-1`}
            value={filters.branch_id || ''}
            onChange={(e) => onChange({ branch_id: e.target.value || '' })}
          >
            <option value="">Tất cả chi nhánh</option>
            {(options.branches || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
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
        <div>
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
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-slate-600">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!filters.only_finalized}
            onChange={(e) => onChange({ only_finalized: e.target.checked, only_missing: false })}
          />
          Chỉ phiếu đã chốt
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!filters.only_missing}
            onChange={(e) => onChange({ only_missing: e.target.checked, only_finalized: false })}
          />
          Chưa lập phiếu lương
        </label>
      </div>
    </section>
  );
};

export default SalaryReportFilters;
