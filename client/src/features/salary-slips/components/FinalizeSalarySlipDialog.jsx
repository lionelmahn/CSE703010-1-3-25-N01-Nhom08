import React from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { formatVnd } from '../utils';

const FinalizeSalarySlipDialog = ({ open, view, saving, onClose, onConfirm }) => {
  if (!open || !view) return null;

  const blocking = (view.issues || []).filter((i) => i.severity === 'error');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}>
      <div className="w-full max-w-[460px] rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-[14px] font-extrabold text-slate-900">
            Chốt phiếu lương {String(view.period_month).padStart(2, '0')}/{view.period_year}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-4 text-[12px] text-slate-700">
          <p>
            Bác sĩ: <b>{view.staff?.full_name}</b>
          </p>
          <p>
            Tổng lương: <b className="text-slate-900">{formatVnd(view.totals?.total_amount)}</b>
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700">
            Sau khi chốt, phiếu lương sẽ được lưu snapshot và <b>không thể sửa trực tiếp</b>.
          </div>

          {blocking.length > 0 && (
            <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
              <p className="flex items-center gap-1 font-semibold">
                <AlertTriangle size={14} /> Không thể chốt — còn {blocking.length} vấn đề:
              </p>
              <ul className="list-disc pl-4">
                {blocking.map((issue, index) => (
                  <li key={index}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || blocking.length > 0}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Lock size={14} /> {saving ? 'Đang chốt...' : 'Xác nhận chốt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeSalarySlipDialog;
