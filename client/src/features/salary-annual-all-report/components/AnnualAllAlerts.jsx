import React from 'react';
import { AlertTriangle, Unlock, RefreshCcw, Info } from 'lucide-react';

const AlertCard = ({ icon: Icon, tone, title, desc, actionLabel, onAction }) => {
  const tones = {
    rose: 'border-rose-200 bg-rose-50 text-rose-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
    orange: 'border-orange-200 bg-orange-50 text-orange-600',
    slate: 'border-slate-200 bg-slate-50 text-slate-500',
  };
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${tones[tone]}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="mr-auto min-w-0">
        <h3 className="text-[12px] font-extrabold">{title}</h3>
        <p className="mt-0.5 text-[11px] leading-4 opacity-90">{desc}</p>
      </div>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 self-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-50"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

// UC19 - hang the canh bao (A1/A2/E5). Click "Xem" loc theo trang thai tuong ung.
const AnnualAllAlerts = ({ summary, onFilterStatus }) => {
  if (!summary) return null;
  const s = summary;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <AlertCard
        icon={AlertTriangle}
        tone="rose"
        title="Chưa lập phiếu lương"
        desc={`${s.doctor_months_not_created} bác sĩ/tháng có ca làm nhưng chưa lập phiếu.`}
        actionLabel="Xem"
        onAction={() => onFilterStatus('not_created')}
      />
      <AlertCard
        icon={Unlock}
        tone="amber"
        title="Phiếu chưa chốt"
        desc={`${s.unfinalized_count} phiếu lương chưa được chốt/hoàn tất.`}
        actionLabel="Xem"
        onAction={() => onFilterStatus('calculated')}
      />
      <AlertCard
        icon={RefreshCcw}
        tone="orange"
        title="Cần tính lại / điều chỉnh"
        desc={`${s.adjustment_required} phiếu lương cần tính lại hoặc rà soát.`}
        actionLabel="Xem"
        onAction={() => onFilterStatus('needs_recalculate')}
      />
      <AlertCard
        icon={Info}
        tone="slate"
        title="Dữ liệu tạm tính"
        desc={
          s.is_provisional
            ? 'Báo cáo còn phiếu chưa chốt — số liệu có thể thay đổi.'
            : 'Tất cả phiếu trong phạm vi đã được chốt.'
        }
      />
    </div>
  );
};

export default AnnualAllAlerts;
