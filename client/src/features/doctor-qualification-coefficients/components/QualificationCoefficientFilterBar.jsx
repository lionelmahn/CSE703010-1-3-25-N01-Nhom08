import React from 'react';
import { STATUS_OPTIONS, TYPE_OPTIONS } from '../constants';

const QualificationCoefficientFilterBar = ({ filters, setFilter, resetFilters }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_.8fr_.8fr_.8fr_.8fr_auto]">
      <input
        value={filters.q}
        onChange={(event) => setFilter('q', event.target.value)}
        placeholder="Tìm mã, học hàm/học vị"
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      />
      <select
        value={filters.type}
        onChange={(event) => setFilter('type', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      >
        <option value="all">Tất cả loại</option>
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(event) => setFilter('status', event.target.value)}
        className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
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
        className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
      >
        Xóa lọc
      </button>
    </div>
  </section>
);

export default QualificationCoefficientFilterBar;
