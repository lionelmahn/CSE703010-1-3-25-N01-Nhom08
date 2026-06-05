import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const fieldClass =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500';

const HourlyRateFilterBar = ({ filters, setFilter, resetFilters }) => (
  <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex min-h-[54px] min-w-[120px] items-center gap-2 self-stretch text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
      <Filter size={14} /> Bộ lọc
    </div>

    <label className="min-w-[150px] flex-1">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">Trạng thái</span>
      <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)} className={fieldClass}>
        <option value="all">Tất cả</option>
        <option value="active">Đang áp dụng</option>
        <option value="upcoming">Sắp áp dụng</option>
        <option value="expired">Hết hiệu lực</option>
        <option value="stopped">Đã dừng</option>
      </select>
    </label>

    <label className="min-w-[150px] flex-1">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">Từ ngày</span>
      <input type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} className={fieldClass} />
    </label>

    <label className="min-w-[150px] flex-1">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">Đến ngày</span>
      <input type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} className={fieldClass} />
    </label>

    <button
      type="button"
      onClick={resetFilters}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
    >
      <RotateCcw size={13} /> Làm mới
    </button>
  </div>
);

export default HourlyRateFilterBar;
