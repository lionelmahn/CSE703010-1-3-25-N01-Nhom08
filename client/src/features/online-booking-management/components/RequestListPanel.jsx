import React from 'react';
import { Eye, Filter, FileDown, Loader2 } from 'lucide-react';

import FilterBar from './FilterBar';
import Pagination from './Pagination';
import StatusBadge from './StatusBadge';
import {
  formatDateOnly,
  formatDateTime,
  formatPhone,
  getServiceLabels,
  getTimeSlotLabel,
} from '../utils';
import useOnlineBookingCatalogs from '../hooks/useOnlineBookingCatalogs';

const ListEmpty = () => (
  <tr>
    <td colSpan="9" className="text-center text-gray-400 py-10 text-xs">
      Khong co yeu cau nao khop bo loc hien tai.
    </td>
  </tr>
);

const ListLoading = () => (
  <tr>
    <td colSpan="9" className="py-10">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Loader2 size={14} className="animate-spin" /> Dang tai du lieu...
      </div>
    </td>
  </tr>
);

const RequestListPanel = ({
  items,
  loading,
  error,
  meta,
  filters,
  page,
  perPage,
  selectedId,
  onSelect,
  onFilterChange,
  onRefresh,
  onPageChange,
  onPerPageChange,
}) => {
  const catalogs = useOnlineBookingCatalogs();

  return (
    <div className="flex-[1.4] bg-white border rounded-lg shadow-sm flex flex-col min-w-0">
      <div className="px-4 py-3 flex justify-between items-center border-b gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-800">Yeu cau dat lich online</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Quan ly va xu ly cac yeu cau dat lich tu landing page</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            disabled
            title="Tinh nang xuat Excel se duoc bo sung sau"
          >
            <FileDown size={12} /> Xuat Excel
          </button>
          <button
            type="button"
            className="px-3 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            disabled
            title="Bo loc nang cao se duoc bo sung sau"
          >
            <Filter size={12} /> Bo loc
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={onFilterChange} onRefresh={onRefresh} />

      {error && (
        <div className="mx-3 mt-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
            <tr className="text-[11px] text-gray-500 border-b">
              <th className="py-2.5 px-3 font-medium">Ma yeu cau</th>
              <th className="py-2.5 px-2 font-medium">Ho va ten</th>
              <th className="py-2.5 px-2 font-medium">So dien thoai</th>
              <th className="py-2.5 px-2 font-medium">Dich vu</th>
              <th className="py-2.5 px-2 font-medium">Ngay mong muon</th>
              <th className="py-2.5 px-2 font-medium text-center">Trang thai</th>
              <th className="py-2.5 px-2 font-medium text-center">Nguon</th>
              <th className="py-2.5 px-2 font-medium">Ngay gui</th>
              <th className="py-2.5 px-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-gray-700">
            {loading ? (
              <ListLoading />
            ) : items.length === 0 ? (
              <ListEmpty />
            ) : (
              items.map((req) => {
                const isSelected = selectedId === req.id;
                return (
                  <tr
                    key={req.id}
                    onClick={() => onSelect(req.id)}
                    className={`border-b cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                      }`}
                  >
                    <td className="py-2 px-3 font-medium text-gray-900">{req.code}</td>
                    <td className="py-2 px-2 font-medium text-gray-900">{req.name}</td>
                    <td className="py-2 px-2 text-gray-700">{formatPhone(req.phone)}</td>
                    <td className="py-2 px-2 text-gray-600 max-w-[160px] truncate" title={getServiceLabels(req.service_ids, catalogs.services)}>
                      {getServiceLabels(req.service_ids, catalogs.services)}
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      {formatDateOnly(req.preferred_date)}
                      <br />
                      <span className="text-[10px] text-gray-400">{getTimeSlotLabel(req.preferred_time_slot_id, catalogs.timeSlots)}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-2 px-2 text-center text-gray-500">Landing page</td>
                    <td className="py-2 px-2 text-gray-500">{formatDateTime(req.submitted_at)}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(req.id);
                        }}
                        className={`p-1 border rounded ${isSelected ? 'border-blue-500 text-blue-600 bg-white' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
                        aria-label="Xem chi tiet"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        meta={meta}
        page={page}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </div>
  );
};

export default RequestListPanel;
