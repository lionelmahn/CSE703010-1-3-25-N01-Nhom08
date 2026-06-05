import React from 'react';
import { History, StopCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  dayTypeLabel,
  formatCoefficient,
  formatDate,
  shiftTypeLabel,
  versionLabel,
} from '../utils';

const ShiftCoefficientTable = ({ rows, loading, selectedId, canManage, onView, onStop, onHistory }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-4 py-3">
      <h2 className="text-[13px] font-extrabold text-slate-950">Danh sách phiên bản hệ số ca</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-[920px] w-full text-[12px]">
        <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">Mã</th>
            <th className="px-3 py-3">Tên</th>
            <th className="px-3 py-3">Loại ngày</th>
            <th className="px-3 py-3">Loại ca</th>
            <th className="px-3 py-3 text-right">Hệ số</th>
            <th className="px-3 py-3">Hiệu lực</th>
            <th className="px-3 py-3">Trạng thái</th>
            <th className="px-3 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Đang tải...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Chưa có cấu hình hệ số ca.</td>
            </tr>
          )}
          {!loading && rows.map((row) => {
            const canStop = canManage && ['active', 'upcoming'].includes(row.status);
            return (
              <tr key={row.id} className={selectedId === row.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}>
                <td className="px-3 py-3 font-bold text-slate-900">
                  <button type="button" onClick={() => onView?.(row)} className="hover:underline">
                    {versionLabel(rows, row)} · {row.code}
                  </button>
                </td>
                <td className="max-w-[220px] px-3 py-3 text-slate-700">{row.name}</td>
                <td className="px-3 py-3">{dayTypeLabel(row.day_type)}</td>
                <td className="px-3 py-3">{shiftTypeLabel(row.shift_type)}</td>
                <td className="px-3 py-3 text-right text-[14px] font-extrabold text-slate-950">
                  x{formatCoefficient(row.coefficient)}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {formatDate(row.effective_from)} - {row.effective_to ? formatDate(row.effective_to) : 'Không thời hạn'}
                </td>
                <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onHistory?.(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Xem lịch sử phiên bản"
                    >
                      <History size={14} />
                    </button>
                    {canStop && (
                      <button
                        type="button"
                        onClick={() => onStop?.(row)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label="Ngừng áp dụng"
                      >
                        <StopCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

export default ShiftCoefficientTable;
