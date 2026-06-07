import React from 'react';
import { Calculator, RefreshCw, Lock, Download, Printer, User, UserCog } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { MONTH_OPTIONS, yearOptions, formatDateTime } from '../utils';

const selectClass =
  'h-8 rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500';

const btnBase =
  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold disabled:opacity-50';

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const SalarySlipHeaderBar = ({
  selectedDoctor,
  month,
  year,
  onChangeMonth,
  onChangeYear,
  onOpenPicker,
  slipStatus,
  hasSlip,
  lastCalcAt,
  lastCalcBy,
  canFinalize,
  canManage,
  loading,
  busy,
  onCalculate,
  onCreate,
  onRecalculate,
  onFinalize,
  onExport,
  onPrint,
}) => {
  const years = yearOptions();
  const isFinalized = slipStatus === 'finalized';

  if (!selectedDoctor) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <User size={24} />
        </div>
        <p className="text-[13px] font-semibold text-slate-700">Chọn bác sĩ để bắt đầu lập phiếu lương</p>
        <button
          type="button"
          onClick={onOpenPicker}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700"
        >
          <UserCog size={15} /> Chọn bác sĩ
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1.3fr_1fr_.8fr_1fr_auto]">
      {/* Bác sĩ */}
      <div className="flex items-center gap-3 xl:border-r xl:border-slate-200 xl:pr-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-600">
          {initials(selectedDoctor.full_name)}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">Bác sĩ</p>
          <h2 className="truncate text-[15px] font-extrabold text-slate-950">{selectedDoctor.full_name}</h2>
          <button type="button" onClick={onOpenPicker} className="text-[11px] font-semibold text-blue-600 hover:underline">
            {selectedDoctor.employee_code} · Đổi
          </button>
        </div>
      </div>

      {/* Kỳ lương */}
      <div className="xl:border-r xl:border-slate-200 xl:pr-4">
        <p className="text-[11px] text-slate-500">Kỳ lương</p>
        <p className="text-[20px] font-extrabold text-slate-950">
          {String(month).padStart(2, '0')}/{year}
        </p>
        <div className="mt-1 flex gap-1">
          <select value={month} onChange={(e) => onChangeMonth(Number(e.target.value))} className={selectClass}>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => onChangeYear(Number(e.target.value))} className={selectClass}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trạng thái phiếu */}
      <div className="xl:border-r xl:border-slate-200 xl:pr-4">
        <p className="text-[11px] text-slate-500">Trạng thái phiếu</p>
        <div className="mt-2">
          <StatusBadge status={hasSlip ? slipStatus : 'none'} />
        </div>
      </div>

      {/* Lần tính gần nhất */}
      <div className="xl:border-r xl:border-slate-200 xl:pr-4">
        <p className="text-[11px] text-slate-500">Lần tính gần nhất</p>
        {lastCalcAt ? (
          <>
            <p className="text-[13px] font-bold text-slate-800">{formatDateTime(lastCalcAt)}</p>
            <p className="text-[11px] text-slate-500">bởi {lastCalcBy || '—'}</p>
          </>
        ) : (
          <p className="mt-1 text-[12px] text-slate-400">Chưa tính</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap content-start justify-end gap-2">
        <button
          type="button"
          onClick={onCalculate}
          disabled={loading}
          className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}
        >
          <Calculator size={13} /> Tính lương
        </button>

        {canManage && !hasSlip && (
          <button
            type="button"
            onClick={onCreate}
            disabled={busy || loading}
            className={`${btnBase} border border-slate-900 bg-slate-900 text-white hover:bg-slate-800`}
          >
            <Calculator size={13} /> Tạo &amp; lưu
          </button>
        )}
        {canManage && hasSlip && (
          <>
            <button
              type="button"
              onClick={onRecalculate}
              disabled={busy || loading || isFinalized}
              className={`${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
            >
              <RefreshCw size={13} /> Tính lại
            </button>
            <button
              type="button"
              onClick={onFinalize}
              disabled={busy || loading || isFinalized || !canFinalize}
              title={!canFinalize ? 'Còn cảnh báo cần xử lý trước khi chốt' : ''}
              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <Lock size={13} /> Chốt lương
            </button>
          </>
        )}
        {canManage && (
          <>
            <button type="button" onClick={onExport} className={`${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
              <Download size={13} /> Xuất Excel
            </button>
            <button type="button" onClick={onPrint} className={`${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
              <Printer size={13} /> In phiếu
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SalarySlipHeaderBar;
