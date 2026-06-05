import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { STATUS_LABEL, formatDate, formatDateTime, formatVnd, toDateInputValue, versionLabel } from '../utils';

const DETAIL_LIMIT = 255;
const inputClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-red-500';

const StopHourlyRateDialog = ({ open, rate, rates = [], onClose, onSubmit, saving, error }) => {
  const [effectiveTo, setEffectiveTo] = useState('');
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEffectiveTo(rate?.status === 'active' ? toDateInputValue(new Date()) : '');
    setReason('');
    setReasonDetail('');
    setClientError('');
  }, [open, rate?.status]);

  if (!open || !rate) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!reason) {
      setClientError('Vui lòng chọn lý do ngừng áp dụng.');
      return;
    }
    if (!reasonDetail.trim()) {
      setClientError('Vui lòng nhập chi tiết lý do ngừng áp dụng.');
      return;
    }
    onSubmit?.({
      effective_to: effectiveTo || undefined,
      reason,
      reason_detail: reasonDetail.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/45 p-3 lg:items-center">
      <div className="w-full max-w-[580px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600">
              <AlertTriangle size={19} />
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-950">Ngừng áp dụng phiên bản này</h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                Hành động này sẽ kết thúc hiệu lực phiên bản cho các kỳ lương tương lai.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 text-[12px]">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
              Thông tin phiên bản
            </h4>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-[11px]">
              <dt className="text-slate-500">Phiên bản</dt>
              <dd className="font-semibold text-slate-950">
                {versionLabel(rates, rate)} ({STATUS_LABEL[rate.status] || rate.status})
              </dd>
              <dt className="text-slate-500">Mức tiền/giờ</dt>
              <dd className="font-semibold text-slate-950">{formatVnd(rate.hourly_rate)}</dd>
              <dt className="text-slate-500">Hiệu lực đến hiện tại</dt>
              <dd className="font-semibold text-slate-950">
                {rate.effective_to ? formatDate(rate.effective_to) : 'Không thời hạn'}
              </dd>
              <dt className="text-slate-500">Người tạo</dt>
              <dd className="font-semibold text-slate-950">{rate.creator?.name || 'Hệ thống'}</dd>
              <dt className="text-slate-500">Ngày tạo</dt>
              <dd className="font-semibold text-slate-950">{formatDateTime(rate.created_at)}</dd>
            </dl>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-800">
              Lý do ngừng áp dụng <b className="text-red-600">*</b>
            </span>
            <select
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setClientError('');
              }}
              className={inputClass}
              required
            >
              <option value="">Chọn lý do ngừng áp dụng</option>
              <option value="policy_changed">Thay đổi chính sách lương</option>
              <option value="incorrect_config">Cấu hình chưa phù hợp</option>
              <option value="replaced_by_new_version">Đã có phiên bản thay thế</option>
              <option value="other">Khác</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-800">Ngày ngừng áp dụng</span>
            <input
              type="date"
              value={effectiveTo}
              onChange={(event) => setEffectiveTo(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-800">
              Chi tiết lý do <b className="text-red-600">*</b>
            </span>
            <textarea
              value={reasonDetail}
              onChange={(event) => {
                setReasonDetail(event.target.value.slice(0, DETAIL_LIMIT));
                setClientError('');
              }}
              rows={4}
              maxLength={DETAIL_LIMIT}
              className="w-full rounded-md border border-slate-200 p-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Nhập chi tiết lý do ngừng áp dụng..."
              required
            />
            <span className="mt-1 block text-right text-[10px] text-slate-500">
              {reasonDetail.length}/{DETAIL_LIMIT}
            </span>
          </label>

          {(clientError || error) && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
              {clientError || error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 min-w-[110px] rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 min-w-[190px] rounded-md bg-red-600 px-5 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? 'Đang xử lý...' : 'Xác nhận ngừng áp dụng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StopHourlyRateDialog;
