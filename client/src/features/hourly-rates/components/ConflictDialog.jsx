import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatDate, formatVnd } from '../utils';

const ConflictDialog = ({ open, payload, message, onClose, onAdjust, onCreateAfter }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/45 p-3 lg:items-center">
      <div className="w-full max-w-[580px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
              <AlertTriangle size={19} />
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-950">Xung đột khoảng hiệu lực</h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                Khoảng hiệu lực bạn nhập đang trùng với một phiên bản hiện có.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-[12px]">
          <section className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-amber-900">
              Thông tin xung đột
            </h4>
            <p className="text-amber-800">{message || 'Backend từ chối vì khoảng hiệu lực bị trùng.'}</p>
          </section>

          <section className="rounded-md border border-slate-200 p-3">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
              Khoảng hiệu lực bạn nhập
            </h4>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-[11px]">
              <dt className="text-slate-500">Hiệu lực từ</dt>
              <dd className="font-semibold text-slate-950">{formatDate(payload?.effective_from)}</dd>
              <dt className="text-slate-500">Hiệu lực đến</dt>
              <dd className="font-semibold text-slate-950">
                {payload?.effective_to ? formatDate(payload.effective_to) : 'Không thời hạn'}
              </dd>
              <dt className="text-slate-500">Mức tiền/giờ</dt>
              <dd className="font-semibold text-slate-950">{formatVnd(payload?.hourly_rate)}</dd>
            </dl>
          </section>

          <section className="rounded-md border border-slate-200 p-3">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Hướng xử lý</h4>
            <div className="space-y-3">
              <button
                type="button"
                onClick={onAdjust}
                className="flex w-full items-start gap-2 text-left text-slate-700 hover:text-blue-700"
              >
                <span className="mt-1 h-3 w-3 rounded-full border border-blue-600" />
                Điều chỉnh ngày hiệu lực để tránh xung đột.
              </button>
              <button
                type="button"
                onClick={onCreateAfter}
                className="flex w-full items-start gap-2 text-left text-slate-700 hover:text-blue-700"
              >
                <span className="mt-1 h-3 w-3 rounded-full border border-blue-600" />
                Tạo phiên bản mới sau ngày kết thúc của cấu hình hiện có.
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex w-full items-start gap-2 text-left text-slate-700 hover:text-blue-700"
              >
                <span className="mt-1 h-3 w-3 rounded-full border border-blue-600" />
                Hủy thao tác.
              </button>
            </div>
          </section>

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 min-w-[120px] rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictDialog;
