import React from 'react';
import { PROCESSING_LEVEL_OPTIONS, STATUS_OPTIONS } from '../constants';

const ServiceComplexityFilterBar = ({ filters, setFilter, resetFilters, options }) => {
  const services = options?.services || [];
  const groups = options?.service_groups || [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(150px,1fr))_auto]">
        <input
          value={filters.q}
          onChange={(event) => setFilter('q', event.target.value)}
          placeholder="Tìm theo mã hoặc tên dịch vụ"
          className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
        />
        <select
          value={filters.group_id}
          onChange={(event) => setFilter('group_id', event.target.value)}
          className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
        >
          <option value="all">Tất cả nhóm</option>
          {groups.map((group) => (
            <option key={group.id} value={String(group.id)}>{group.name}</option>
          ))}
        </select>
        <select
          value={filters.service_id}
          onChange={(event) => setFilter('service_id', event.target.value)}
          className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
        >
          <option value="all">Tất cả dịch vụ</option>
          {services.map((service) => (
            <option key={service.id} value={String(service.id)}>
              {service.service_code || `DV${service.id}`} - {service.name}
            </option>
          ))}
        </select>
        <select
          value={filters.processing_level}
          onChange={(event) => setFilter('processing_level', event.target.value)}
          className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
        >
          <option value="all">Tất cả mức xử lý</option>
          {PROCESSING_LEVEL_OPTIONS.map((level) => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilter('from', event.target.value)}
          className="h-10 rounded-md border border-slate-200 px-3 text-[12px]"
        />
        <button
          type="button"
          onClick={resetFilters}
          className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Đặt lại
        </button>
      </div>
    </section>
  );
};

export default ServiceComplexityFilterBar;
