import React from 'react';
import StatusBadge from './StatusBadge';
import { formatVnd, formatCoefficient, formatNumber } from '../utils';

const Card = ({ label, value, sub }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className="mt-2 text-[24px] font-extrabold text-slate-950">{value}</p>
    {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
  </article>
);

const SalarySlipSummary = ({ view, slipStatus }) => {
  if (!view) return null;

  const { totals } = view;
  const statusKey = view.existing_slip_id ? slipStatus : 'none';

  return (
    <div>
      <h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
        Tổng quan phiếu lương
      </h3>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Card label="Tổng ca làm" value={formatNumber(totals?.total_shifts)} sub="ca" />
        <Card label="Tổng giờ chuyển đổi" value={formatCoefficient(totals?.total_converted_hours)} sub="giờ" />
        <Card label="Tổng hệ số bệnh nhân" value={formatCoefficient(totals?.total_patient_coefficient)} />
        <Card label="Tổng lương" value={formatVnd(totals?.total_amount)} sub="VNĐ" />
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] text-slate-500">Trạng thái phiếu</p>
          <div className="mt-2">
            <StatusBadge status={statusKey} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {statusKey === 'finalized' ? 'Đã chốt' : statusKey === 'none' ? 'Chưa lập' : 'Chưa chốt'}
          </p>
        </article>
      </div>
    </div>
  );
};

export default SalarySlipSummary;
