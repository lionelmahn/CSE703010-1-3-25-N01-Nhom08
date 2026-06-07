import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatVnd, formatCoefficient, formatHours } from '../utils';

const CheckRow = ({ ok, label, value }) => (
  <div className="flex items-center justify-between gap-2 text-[11px]">
    <span className="flex items-center gap-2 text-slate-600">
      {ok ? (
        <CheckCircle2 size={14} className="text-emerald-600" />
      ) : (
        <XCircle size={14} className="text-amber-500" />
      )}
      {label}
    </span>
    <span className="text-right font-semibold text-slate-800">{value}</span>
  </div>
);

const SalarySlipDataCheck = ({ view }) => {
  if (!view) return null;

  const { doctor, totals, hourly_rate_snapshot: hourlyRate } = view;
  const errorCount = (view.issues || []).filter((i) => i.severity === 'error').length;
  const warnCount = (view.issues || []).filter((i) => i.severity !== 'error').length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-slate-700">Kiểm tra dữ liệu</h3>
      <div className="space-y-2">
        <CheckRow
          ok={!doctor?.is_default}
          label="Học hàm / Học vị"
          value={doctor?.qualification_name || 'Mặc định (1.00)'}
        />
        <CheckRow
          ok={Boolean(hourlyRate)}
          label="Mức tiền cơ bản/giờ"
          value={hourlyRate ? formatVnd(hourlyRate) : 'Chưa cấu hình'}
        />
        <CheckRow ok label="Hệ số bác sĩ" value={formatCoefficient(doctor?.coefficient)} />
        <CheckRow ok label="Tổng giờ làm việc" value={formatHours(totals?.total_shift_hours)} />
        <CheckRow
          ok={errorCount === 0 && warnCount === 0}
          label="Cảnh báo dữ liệu"
          value={`${errorCount} lỗi · ${warnCount} cảnh báo`}
        />
        <CheckRow
          ok={view.can_finalize}
          label="Sẵn sàng chốt lương"
          value={view.can_finalize ? 'Đủ điều kiện' : 'Cần xử lý'}
        />
      </div>
    </section>
  );
};

export default SalarySlipDataCheck;
