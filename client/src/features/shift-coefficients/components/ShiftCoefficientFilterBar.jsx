import React from 'react';
import { DAY_TYPE_OPTIONS, SHIFT_TYPE_OPTIONS, STATUS_LABEL } from '../constants';

const ShiftCoefficientFilterBar = ({ filters, setFilter, resetFilters }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 md:grid-cols-6">
      <select
        value={filters.status}
        onChange={(event) => setFilter('status', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      >
        <option value="all">Tất cả trạng thái</option>
        {Object.entries(STATUS_LABEL)
          .filter(([status]) => status !== 'default')
          .map(([status, label]) => <option key={status} value={status}>{label}</option>)}
      </select>
      <select
        value={filters.day_type}
        onChange={(event) => setFilter('day_type', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      >
        <option value="all">Tất cả loại ngày</option>
        {DAY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select
        value={filters.shift_type}
        onChange={(event) => setFilter('shift_type', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      >
        <option value="all">Tất cả loại ca</option>
        {SHIFT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <input
        type="date"
        value={filters.from}
        onChange={(event) => setFilter('from', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      />
      <input
        type="date"
        value={filters.to}
        onChange={(event) => setFilter('to', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      />
      <button
        type="button"
        onClick={resetFilters}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
      >
        Xóa lọc
      </button>
    </div>
  </section>
);

export default ShiftCoefficientFilterBar;
