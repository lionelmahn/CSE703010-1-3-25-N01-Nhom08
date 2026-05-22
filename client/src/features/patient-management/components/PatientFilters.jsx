import React from 'react';
import { RotateCcw, Search } from 'lucide-react';

import {
  GENDER_FILTER_OPTIONS,
  PATIENT_STATUS_OPTIONS,
} from '../constants';

/**
 * UC5 - thanh filter danh sach ho so benh nhan.
 * Tuong tu mockup HTML: search + status + source + gender + refresh.
 */
const PatientFilters = ({
  filters,
  onFilterChange,
  onReset,
  sources = [],
  loading = false,
}) => {
  return (
    <div className="p-3 border-b flex flex-col sm:flex-row gap-3 bg-white items-stretch sm:items-end">
      <div className="flex-[1.5] min-w-[200px]">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, họ tên, SĐT, email..."
            value={filters.q}
            onChange={(e) => onFilterChange('q', e.target.value)}
            className="w-full border rounded pl-7 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="text-[10px] text-gray-500 block mb-1">Trạng thái</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
        >
          {PATIENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[160px]">
        <label className="text-[10px] text-gray-500 block mb-1">Nguồn tiếp nhận</label>
        <select
          value={filters.source}
          onChange={(e) => onFilterChange('source', e.target.value)}
          className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
        >
          <option value="all">Tất cả</option>
          {sources.map((src) => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[120px]">
        <label className="text-[10px] text-gray-500 block mb-1">Giới tính</label>
        <select
          value={filters.gender}
          onChange={(e) => onFilterChange('gender', e.target.value)}
          className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
        >
          {GENDER_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={loading}
        className="px-3 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
      >
        <RotateCcw size={12} /> Làm mới
      </button>
    </div>
  );
};

export default PatientFilters;
