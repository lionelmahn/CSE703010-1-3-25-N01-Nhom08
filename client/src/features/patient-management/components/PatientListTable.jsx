import React from 'react';
import { Eye, MoreHorizontal, Pencil } from 'lucide-react';

import StatusBadge from './StatusBadge';
import { formatDate, formatPhone, truncate } from '../utils';
import { PATIENT_STATUS } from '../constants';

/**
 * UC5 - bang danh sach ho so benh nhan.
 * Click row -> open detail panel. Action buttons: view, edit, more.
 */
const PatientListTable = ({
  patients = [],
  selectedId,
  onSelect,
  onEdit,
  onMore,
  loading = false,
  emptyMessage = 'Không có hồ sơ phù hợp.',
}) => {
  return (
    /*
     * Outer flex item: `min-w-0` so it can shrink inside its grid column.
     * Inner scroll container: horizontal scroll happens here so the page
     * itself never overflows. `min-w-[900px]` on the table guarantees the
     * 9-column layout stays readable; narrower viewports get an in-card
     * horizontal scrollbar instead of squeezed columns or a broken page.
     */
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[900px] border-collapse whitespace-nowrap text-left">
          <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
            <tr className="text-[11px] text-gray-500 border-b">
              <th className="py-2.5 px-3 font-medium">Mã bệnh nhân</th>
              <th className="py-2.5 px-2 font-medium">Họ và tên</th>
              <th className="py-2.5 px-2 font-medium">Ngày sinh</th>
              <th className="py-2.5 px-2 font-medium">SĐT</th>
              <th className="py-2.5 px-2 font-medium">Email</th>
              <th className="py-2.5 px-2 font-medium">Nguồn tiếp nhận</th>
              <th className="py-2.5 px-2 font-medium text-center">Trạng thái</th>
              <th className="py-2.5 px-2 font-medium">Ngày tạo</th>
              <th className="py-2.5 px-3 font-medium text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-gray-700">
            {loading && patients.length === 0 && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b animate-pulse">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="py-3 px-2"><div className="h-2 bg-gray-100 rounded" /></td>
                  ))}
                </tr>
              ))
            )}

            {!loading && patients.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 px-3 text-center text-gray-500 text-xs">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {patients.map((p) => {
              const isActive = selectedId === p.id;
              const isMerged = p.status === PATIENT_STATUS.MERGED;
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect?.(p)}
                  className={`border-b cursor-pointer transition ${isActive ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                    } ${isMerged ? 'opacity-80' : ''}`}
                >
                  <td className="py-2 px-3 font-medium text-gray-900">{p.patient_code || '-'}</td>
                  <td className="py-2 px-2 font-medium text-gray-900">{p.full_name}</td>
                  <td className="py-2 px-2">{formatDate(p.dob)}</td>
                  <td className="py-2 px-2">{formatPhone(p.phone)}</td>
                  <td className="py-2 px-2 text-gray-500 truncate max-w-[140px]" title={p.email || ''}>
                    {truncate(p.email || '-', 26)}
                  </td>
                  <td className="py-2 px-2 text-gray-600">{p.source || '-'}</td>
                  <td className="py-2 px-2 text-center"><StatusBadge status={p.status} /></td>
                  <td className="py-2 px-2 text-gray-500">{formatDate(p.created_at)}</td>
                  <td className="py-2 px-3">
                    <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-1 border bg-white rounded text-gray-500 hover:bg-gray-50"
                        title="Xem chi tiết"
                        onClick={() => onSelect?.(p)}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        className="p-1 border bg-white rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                        title="Chỉnh sửa"
                        disabled={isMerged}
                        onClick={() => onEdit?.(p)}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        className="p-1 border bg-white rounded text-gray-500 hover:bg-gray-50"
                        title="Hành động khác"
                        onClick={(e) => onMore?.(p, e)}
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientListTable;
