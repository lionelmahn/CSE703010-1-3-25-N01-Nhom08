import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PROCESSING_LEVEL_OPTIONS } from '../constants';
import {
  formatCoefficient,
  levelDefault,
  levelLabel,
  serviceLabel,
  serviceStatusClassName,
  serviceStatusLabel,
} from '../utils';
import StatusBadge from './StatusBadge';

const EffectiveComplexityMatrix = ({
  data,
  date,
  loading,
  options,
  groupId,
  serviceId,
  onChangeDate,
  onChangeGroup,
  onChangeService,
  onRefresh,
  onCreate,
  onQuick,
}) => {
  const services = data?.services || [];
  const groups = options?.service_groups || [];
  const selectableServices = options?.services || [];
  const levels = data?.processing_levels?.length ? data.processing_levels : PROCESSING_LEVEL_OPTIONS;

  const openCreate = (service, level) => {
    onCreate?.({
      service_id: service.id,
      processing_level: level.value || level,
      coefficient: levelDefault(level.value || level),
      effective_from: date,
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-extrabold text-slate-950">Ma trận hệ số đang hiệu lực</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Hệ số cộng thêm cho UC12 theo dịch vụ và mức xử lý tại ngày được chọn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => onChangeDate?.(event.target.value)}
            className="h-9 rounded-md border border-slate-200 px-3 text-[12px]"
          />
          <select
            value={groupId}
            onChange={(event) => onChangeGroup?.(event.target.value)}
            className="h-9 min-w-[150px] rounded-md border border-slate-200 px-3 text-[12px]"
          >
            <option value="all">Tất cả nhóm</option>
            {groups.map((group) => (
              <option key={group.id} value={String(group.id)}>{group.name}</option>
            ))}
          </select>
          <select
            value={serviceId}
            onChange={(event) => onChangeService?.(event.target.value)}
            className="h-9 min-w-[180px] rounded-md border border-slate-200 px-3 text-[12px]"
          >
            <option value="all">Tất cả dịch vụ</option>
            {selectableServices.map((service) => (
              <option key={service.id} value={String(service.id)}>{service.service_code || `DV${service.id}`} - {service.name}</option>
            ))}
          </select>
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
        <table className="min-w-[900px] w-full table-fixed text-[12px]">
          <colgroup>
            <col className="w-[260px]" />
            {levels.map((level) => <col key={level.value || level} />)}
            <col className="w-[120px]" />
          </colgroup>
          <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Dịch vụ</th>
              {levels.map((level) => (
                <th key={level.value || level} className="px-3 py-3 text-center">{level.label || levelLabel(level)}</th>
              ))}
              <th className="px-3 py-3 text-center">Tac vu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={levels.length + 2} className="px-3 py-8 text-center text-slate-500">Đang tải ma trận...</td>
              </tr>
            )}
            {!loading && services.length === 0 && (
              <tr>
                <td colSpan={levels.length + 2} className="px-3 py-8 text-center text-slate-500">Chưa có dịch vụ có thể cấu hình để hiển thị.</td>
              </tr>
            )}
            {!loading && services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50">
                <th className="px-3 py-3 text-left align-top">
                  <span className="block font-bold text-slate-950">{serviceLabel(service)}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px] font-normal text-slate-500">
                    <span>{service.group?.name || 'Chưa phân nhóm'}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${serviceStatusClassName(service.status)}`}>
                      {serviceStatusLabel(service.status)}
                    </span>
                  </span>
                </th>
                {levels.map((level) => {
                  const key = level.value || level;
                  const cell = data?.matrix?.[service.id]?.[key];
                  return (
                    <td key={key} className="px-2 py-3 text-center align-top">
                      <button
                        type="button"
                        onClick={() => cell?.is_default && openCreate(service, { value: key })}
                        className={`min-h-20 w-full rounded-md border px-2 py-2 text-left transition ${
                          cell?.is_default
                            ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                        disabled={!cell?.is_default || !onCreate}
                      >
                        <span className="block text-center text-[16px] font-extrabold text-slate-950">
                          +{formatCoefficient(cell?.coefficient)}
                        </span>
                        <span className="mt-2 flex justify-center"><StatusBadge status={cell?.status || 'default'} /></span>
                        {cell?.code && <span className="mt-1 block text-center font-mono text-[10px] text-slate-500">{cell.code}</span>}
                      </button>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center align-middle">
                  {onQuick ? (
                    <button
                      type="button"
                      onClick={() => onQuick(service)}
                      className="rounded-md border border-blue-200 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      Cấu hình 4 mức
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default EffectiveComplexityMatrix;
