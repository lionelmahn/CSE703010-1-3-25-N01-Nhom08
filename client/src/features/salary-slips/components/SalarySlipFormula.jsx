import React from 'react';
import { formatVnd } from '../utils';

const Box = ({ title, body }) => (
  <div className="grid min-h-[88px] place-items-center rounded-lg border border-slate-200 bg-white p-3 text-center">
    <div>
      <b className="text-[12px] text-slate-900">{title}</b>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{body}</p>
    </div>
  </div>
);

const Op = ({ children }) => <div className="text-lg font-bold text-slate-400">{children}</div>;

const SalarySlipFormula = ({ totalAmount }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
      Công thức tính lương
    </h3>
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
      <Box
        title="Giờ chuyển đổi"
        body={'Giờ làm việc × (Hệ số ca + Tổng hệ số bệnh nhân)'}
      />
      <Op>=</Op>
      <Box title="Lương ca" body={'Giờ chuyển đổi × Hệ số bác sĩ × Mức tiền/giờ'} />
      <Op>→</Op>
      <div className="grid min-h-[88px] place-items-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
        <div>
          <b className="text-[12px] text-slate-900">Tổng lương</b>
          <p className="mt-1 text-[18px] font-extrabold text-slate-950">{formatVnd(totalAmount)}</p>
        </div>
      </div>
    </div>
    <p className="mt-2 text-[11px] text-slate-400">
      Lưu ý: hệ số ca và tổng hệ số bệnh nhân được <b>cộng</b> với nhau (theo đặc tả nghiệp vụ).
    </p>
  </section>
);

export default SalarySlipFormula;
