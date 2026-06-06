import React from 'react';
import { FileClock, History, StopCircle } from 'lucide-react';
import { formatCoefficient, formatDate, levelLabel, serviceLabel } from '../utils';
import StatusBadge from './StatusBadge';

const ServiceComplexityTable = ({
  rows,
  loading,
  selectedId,
  canManage,
  onHistory,
  onAudit,
  onStop,
}) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-4 py-3">
      <h2 className="text-[13px] font-extrabold text-slate-950">Danh sách phiên bản hệ số phức tạp</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full text-[12px]">
        <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">Mã</th>
            <th className="px-3 py-3">Dịch vụ</th>
            <th className="px-3 py-3">Nhóm</th>
            <th className="px-3 py-3">Mức xử lý</th>
            <th className="px-3 py-3 text-right">Hệ số</th>
            <th className="px-3 py-3">Hiệu lực</th>
            <th className="px-3 py-3">Trạng thái</th>
            <th className="px-3 py-3 text-right">Đã dùng</th>
            <th className="px-3 py-3 text-right">Tác vụ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-slate-500">Đang tải...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-slate-500">Chưa có cấu hình hệ số phức tạp.</td>
            </tr>
          )}
          {!loading && rows.map((row) => {
            const canStop = canManage && ['active', 'upcoming'].includes(row.status);
            return (
              <tr key={row.id} className={selectedId === row.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}>
                <td className="px-3 py-3 font-mono font-bold text-slate-950">{row.code}</td>
                <td className="max-w-[260px] px-3 py-3">
                  <span className="block font-semibold text-slate-900">{serviceLabel(row.service)}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">ID {row.service_id}</span>
                </td>
                <td className="px-3 py-3 text-slate-600">{row.service?.group?.name || '-'}</td>
                <td className="px-3 py-3 font-semibold text-slate-700">{levelLabel(row.processing_level)}</td>
                <td className="px-3 py-3 text-right text-[14px] font-extrabold text-slate-950">
                  +{formatCoefficient(row.coefficient)}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {formatDate(row.effective_from)} - {row.effective_to ? formatDate(row.effective_to) : 'Không thời hạn'}
                </td>
                <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-3 py-3 text-right font-semibold">{row.service_items_count || 0}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onHistory?.(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Xem timeline"
                    >
                      <FileClock size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAudit?.(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Xem audit"
                    >
                      <History size={14} />
                    </button>
                    {canStop ? (
                      <button
                        type="button"
                        onClick={() => onStop?.(row)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label="Ngừng áp dụng"
                      >
                        <StopCircle size={14} />
                      </button>
                    ) : null}
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

export default ServiceComplexityTable;
