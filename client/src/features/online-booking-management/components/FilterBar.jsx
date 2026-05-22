import React from 'react';
import { Calendar, RefreshCw, Search } from 'lucide-react';

import {
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
} from '@/features/online-booking/data';

import {
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
} from '../constants';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tat ca trang thai' },
  { value: REQUEST_STATUS.PENDING, label: REQUEST_STATUS_LABEL[REQUEST_STATUS.PENDING] },
  { value: REQUEST_STATUS.PROCESSING, label: REQUEST_STATUS_LABEL[REQUEST_STATUS.PROCESSING] },
  { value: REQUEST_STATUS.PROPOSE_OTHER, label: REQUEST_STATUS_LABEL[REQUEST_STATUS.PROPOSE_OTHER] },
  { value: REQUEST_STATUS.APPOINTMENT_CREATED, label: REQUEST_STATUS_LABEL[REQUEST_STATUS.APPOINTMENT_CREATED] },
  { value: REQUEST_STATUS.REJECTED, label: REQUEST_STATUS_LABEL[REQUEST_STATUS.REJECTED] },
  { value: REQUEST_STATUS.CANCELED, label: REQUEST_STATUS_LABEL[REQUEST_STATUS.CANCELED] },
];

const FilterBar = ({ filters, onChange, onRefresh }) => (
  <div className="p-3 border-b flex flex-wrap gap-3 bg-white items-end">
    <div className="flex-1 min-w-[140px]">
      <label className="text-[10px] text-gray-500 block mb-1">Trang thai</label>
      <select
        value={filters.status}
        onChange={(e) => onChange('status', e.target.value)}
        className="w-full border rounded px-2 py-1.5 focus:outline-none text-xs"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>

    <div className="flex-1 min-w-[140px]">
      <label className="text-[10px] text-gray-500 block mb-1">Chi nhanh</label>
      <select
        value={filters.branch_id}
        onChange={(e) => onChange('branch_id', e.target.value)}
        className="w-full border rounded px-2 py-1.5 focus:outline-none text-xs"
      >
        <option value="all">Tat ca chi nhanh</option>
        {CLINIC_BRANCHES.map((b) => (
          <option key={b.id} value={b.id}>{b.label}</option>
        ))}
      </select>
    </div>

    <div className="flex-1 min-w-[140px]">
      <label className="text-[10px] text-gray-500 block mb-1">Dich vu</label>
      <select
        value={filters.service_id}
        onChange={(e) => onChange('service_id', e.target.value)}
        className="w-full border rounded px-2 py-1.5 focus:outline-none text-xs"
      >
        <option value="all">Tat ca dich vu</option>
        {BOOKING_SERVICES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>

    <div className="flex-1 min-w-[140px]">
      <label className="text-[10px] text-gray-500 block mb-1">Ngay mong muon tu</label>
      <div className="relative">
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => onChange('date_from', e.target.value)}
          className="w-full border rounded px-2 py-1.5 focus:outline-none text-xs"
        />
        <Calendar size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>

    <div className="flex-[1.5] min-w-[200px]">
      <label className="text-[10px] text-gray-500 block mb-1">Tim kiem (ma, ten, sdt, email)</label>
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="OLB202500123, sdt, email..."
          value={filters.q}
          onChange={(e) => onChange('q', e.target.value)}
          className="w-full border rounded pl-7 pr-2 py-1.5 focus:outline-none text-xs"
        />
      </div>
    </div>

    <button
      type="button"
      onClick={onRefresh}
      className="px-3 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1"
    >
      <RefreshCw size={12} /> Lam moi
    </button>
  </div>
);

export default FilterBar;
