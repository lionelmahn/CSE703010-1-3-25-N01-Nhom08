import React from 'react';
import { RefreshCw } from 'lucide-react';
import {
  formatCoefficient,
  formatDate,
  qualificationsFromOptions,
  typeLabel,
} from '../utils';
import StatusBadge from './StatusBadge';

const EffectiveQualificationMatrix = ({
  data,
  date,
  loading,
  options,
  onChangeDate,
  onRefresh,
  onCreate,
}) => {
  const qualifications = data?.qualifications?.length
    ? data.qualifications
    : qualificationsFromOptions(options);

  const openCreate = (qualification) => {
    onCreate?.({
      qualification_code: qualification.code,
      qualification_type: qualification.type,
      priority: qualification.priority,
      coefficient: qualification.default_coefficient || 1,
      effective_from: date,
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-extrabold text-slate-950">Ma trận hệ số đang hiệu lực</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Hệ số áp dụng cho bác sĩ theo học hàm/học vị tại ngày được chọn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => onChangeDate?.(event.target.value)}
            className="h-9 rounded-md border border-slate-200 px-3 text-[12px]"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Tải lại ma trận"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] table-fixed text-[12px]">
          <colgroup>
            <col className="w-[220px]" />
            <col className="w-[130px]" />
            <col className="w-[90px]" />
            <col />
            <col className="w-[150px]" />
          </colgroup>
          <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Học hàm/học vị</th>
              <th className="px-3 py-3">Loại</th>
              <th className="px-3 py-3 text-center">Ưu tiên</th>
              <th className="px-3 py-3 text-center">Hệ số hiện hành</th>
              <th className="px-3 py-3 text-center">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">Đang tải ma trận...</td>
              </tr>
            ) : null}
            {!loading && qualifications.map((qualification) => {
              const cell = data?.matrix?.[qualification.code];
              return (
                <tr key={qualification.code} className="hover:bg-slate-50">
                  <th className="px-3 py-3 text-left align-middle">
                    <span className="block font-bold text-slate-950">{qualification.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] font-normal text-slate-500">{qualification.code}</span>
                  </th>
                  <td className="px-3 py-3">{typeLabel(qualification.type)}</td>
                  <td className="px-3 py-3 text-center font-bold">{qualification.priority}</td>
                  <td className="px-3 py-3">
                    <div className={`rounded-md border px-3 py-2 ${
                      cell?.is_default ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <span className="text-[18px] font-extrabold text-slate-950">
                          {formatCoefficient(cell?.coefficient)}
                        </span>
                        <StatusBadge status={cell?.status || 'default'} />
                        {cell?.code ? <span className="font-mono text-[10px] text-slate-500">{cell.code}</span> : null}
                      </div>
                      <div className="mt-1 text-center text-[10px] text-slate-500">
                        {cell?.effective_from ? `${formatDate(cell.effective_from)} - ${formatDate(cell.effective_to)}` : `Gợi ý ${formatCoefficient(cell?.suggested_coefficient || qualification.default_coefficient)}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {cell?.is_default && onCreate ? (
                      <button
                        type="button"
                        onClick={() => openCreate(qualification)}
                        className="rounded-md border border-blue-200 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Cấu hình ngay
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Đã có cấu hình</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default EffectiveQualificationMatrix;
