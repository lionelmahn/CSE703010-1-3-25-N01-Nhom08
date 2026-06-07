import React from 'react';
import { Eye, History, PauseCircle, ScrollText } from 'lucide-react';
import { formatCoefficient, formatDate, typeLabel } from '../utils';
import StatusBadge from './StatusBadge';

const canStop = (row) => ['active', 'upcoming'].includes(row?.status);

const QualificationCoefficientTable = ({
  rows,
  loading,
  selectedId,
  canManage,
  onView,
  onStop,
  onHistory,
  onAudit,
}) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-4 py-3">
      <h2 className="text-[13px] font-extrabold text-slate-950">Danh sách phiên bản cấu hình</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] table-fixed text-[12px]">
        <colgroup>
          <col className="w-[125px]" />
          <col className="w-[190px]" />
          <col className="w-[110px]" />
          <col className="w-[90px]" />
          <col className="w-[110px]" />
          <col className="w-[210px]" />
          <col className="w-[115px]" />
          <col className="w-[190px]" />
        </colgroup>
        <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">Mã</th>
            <th className="px-3 py-3">Học hàm/học vị</th>
            <th className="px-3 py-3">Loại</th>
            <th className="px-3 py-3 text-center">Ưu tiên</th>
            <th className="px-3 py-3 text-center">Hệ số</th>
            <th className="px-3 py-3">Hiệu lực</th>
            <th className="px-3 py-3">Trạng thái</th>
            <th className="px-3 py-3 text-right">Tác vụ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Đang tải danh sách...</td>
            </tr>
          ) : null}
          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Chưa có cấu hình hệ số bác sĩ.</td>
            </tr>
          ) : null}
          {!loading && rows.map((row) => (
            <tr key={row.id} className={selectedId === row.id ? 'bg-blue-50/70' : 'hover:bg-slate-50'}>
              <td className="px-3 py-3 font-mono text-[11px] text-slate-600">{row.code}</td>
              <td className="px-3 py-3">
                <span className="block font-bold text-slate-950">{row.qualification_name}</span>
                <span className="font-mono text-[10px] text-slate-500">{row.qualification_code}</span>
              </td>
              <td className="px-3 py-3">{typeLabel(row.qualification_type)}</td>
              <td className="px-3 py-3 text-center font-bold">{row.priority}</td>
              <td className="px-3 py-3 text-center text-[14px] font-extrabold">{formatCoefficient(row.coefficient)}</td>
              <td className="px-3 py-3 text-slate-600">
                {formatDate(row.effective_from)} - {formatDate(row.effective_to)}
              </td>
              <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => onView?.(row)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" title="Xem chi tiết">
                    <Eye size={14} />
                  </button>
                  <button type="button" onClick={() => onHistory?.(row)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" title="Lịch sử phiên bản">
                    <History size={14} />
                  </button>
                  <button type="button" onClick={() => onAudit?.(row)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" title="Nhật ký">
                    <ScrollText size={14} />
                  </button>
                  {canManage && canStop(row) ? (
                    <button type="button" onClick={() => onStop?.(row)} className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600 hover:bg-red-50" title="Ngừng áp dụng">
                      <PauseCircle size={14} />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default QualificationCoefficientTable;
