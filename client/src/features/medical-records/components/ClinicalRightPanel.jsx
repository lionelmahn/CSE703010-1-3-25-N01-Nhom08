import React from 'react';
import { AlertCircle, Pill, Camera, RotateCcw, FileText, Calendar } from 'lucide-react';
import { formatVnd } from '../lib/format';

/**
 * UC12 - Cot phai workspace: tom tat dieu tri + canh bao + quick actions.
 */
export default function ClinicalRightPanel({ session, onRecall }) {
  if (!session) return null;
  const items = session.service_items || [];
  const itemCount = items.length;
  const total = items.reduce((sum, it) => sum + Number(it.subtotal_snapshot || 0), 0);
  const missing = [];
  if (!session.chief_complaint) missing.push('Lý do đến khám');
  if (!session.diagnosis) missing.push('Chẩn đoán');
  if (!session.conclusion) missing.push('Kết luận');
  if (itemCount === 0) missing.push('Chỉ định dịch vụ');

  return (
    <aside className="space-y-4 border-l border-slate-100 bg-slate-50/40 p-4 lg:max-w-[300px]">
      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 mb-2">
          Tổng quan điều trị
        </h2>
        <div className="text-xs text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>Số dịch vụ</span>
            <span className="font-semibold">{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span className="font-semibold text-slate-900">{formatVnd(total)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-amber-800 mb-2">
          Cần hoàn thiện
        </h2>
        {missing.length === 0 ? (
          <p className="text-xs text-emerald-700">Đã đủ điều kiện hoàn tất.</p>
        ) : (
          <ul className="space-y-1 text-xs text-amber-800">
            {missing.map((m) => (
              <li key={m} className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {m}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 mb-2">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction Icon={Pill} label="Đơn thuốc" disabled />
          <QuickAction Icon={Camera} label="Ảnh hồ sơ" disabled />
          <QuickAction Icon={RotateCcw} label="Đề xuất tái khám" onClick={onRecall} />
          <QuickAction Icon={FileText} label="In bệnh án" disabled />
        </div>
        <p className="mt-2 text-[10px] text-slate-400">Một số thao tác sẽ mở khoá ở phiên bản tiếp theo.</p>
      </section>

      {session.recall_date ? (
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <Calendar className="h-3.5 w-3.5" />
            Đề xuất tái khám
          </div>
          <p>Ngày: {String(session.recall_date).slice(0, 10)}</p>
          {session.recall_note ? <p className="text-violet-700">"{session.recall_note}"</p> : null}
        </section>
      ) : null}
    </aside>
  );
}

function QuickAction(props) {
  const { Icon, label, onClick, disabled } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
