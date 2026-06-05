import React from 'react';
import { AlertCircle, Eye, History, StopCircle } from 'lucide-react';
import { formatDate, formatDateTime, formatVnd, sortRatesDesc, versionLabel } from '../utils';
import { DesignPanelHeader, PANEL_CLASS } from './DesignParts';
import StatusBadge from './StatusBadge';

const HourlyRateTable = ({ rows, loading, selectedId, canManage, onView, onStop, onAudit }) => {
  const sortedRows = sortRatesDesc(rows || []);

  return (
    <section className={`flex min-h-0 flex-col ${PANEL_CLASS}`}>
      <DesignPanelHeader title="Tất cả phiên bản" />

      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !sortedRows.length ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400" />
          <div className="text-sm text-slate-500">Chưa có cấu hình mức tiền/giờ phù hợp bộ lọc.</div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-[12px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.06em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-extrabold">Phiên bản</th>
                <th className="px-3 py-3 text-right font-extrabold">Mức tiền/giờ</th>
                <th className="px-3 py-3 font-extrabold">Hiệu lực từ</th>
                <th className="px-3 py-3 font-extrabold">Hiệu lực đến</th>
                <th className="px-3 py-3 text-center font-extrabold">Trạng thái</th>
                <th className="px-3 py-3 font-extrabold">Cập nhật bởi</th>
                <th className="px-3 py-3 font-extrabold">Cập nhật lúc</th>
                <th className="px-4 py-3 text-right font-extrabold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {sortedRows.map((rate) => {
                const canStop = canManage && ['active', 'upcoming'].includes(rate.status);
                const isSelected = selectedId === rate.id;
                return (
                  <tr
                    key={rate.id}
                    onClick={() => onView?.(rate)}
                    className={`cursor-pointer hover:bg-blue-50/60 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-950">{versionLabel(rows, rate)}</div>
                      <div className="text-[11px] text-slate-500">#{rate.id}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-extrabold text-slate-950">{formatVnd(rate.hourly_rate)}</td>
                    <td className="px-3 py-3">{formatDate(rate.effective_from)}</td>
                    <td className="px-3 py-3">{rate.effective_to ? formatDate(rate.effective_to) : 'Không thời hạn'}</td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={rate.status} />
                    </td>
                    <td className="px-3 py-3">{rate.stopper?.name || rate.updater?.name || rate.creator?.name || 'Hệ thống'}</td>
                    <td className="px-3 py-3 text-slate-500">{formatDateTime(rate.updated_at || rate.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onView?.(rate)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={12} /> Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => onAudit?.(rate)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
                          title="Lịch sử thay đổi"
                        >
                          <History size={13} />
                        </button>
                        {canStop && (
                          <button
                            type="button"
                            onClick={() => onStop?.(rate)}
                            className="rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                            title="Ngừng áp dụng"
                          >
                            <StopCircle size={13} />
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
      )}
    </section>
  );
};

export default HourlyRateTable;
