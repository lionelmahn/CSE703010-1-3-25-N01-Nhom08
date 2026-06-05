import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  CHANGE_REASON_OPTIONS,
  calculatePercentChange,
  composeChangeNote,
  formatDate,
  formatVnd,
  toDateInputValue,
} from '../utils';
import { VersionTimeline } from './DesignParts';

const MAX_RATE = 10000000;
const DETAIL_LIMIT = 255;
const inputClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'mb-1 block text-[11px] font-bold text-slate-800';

const HourlyRateFormDialog = ({ open, onClose, onSubmit, saving, error, rates = [], current }) => {
  const [hourlyRate, setHourlyRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [changeReason, setChangeReason] = useState('periodic_adjustment');
  const [reasonDetail, setReasonDetail] = useState('');
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHourlyRate(current?.hourly_rate ? String(Math.round(Number(current.hourly_rate))) : '');
    setEffectiveFrom(toDateInputValue(new Date()));
    setEffectiveTo('');
    setChangeReason('periodic_adjustment');
    setReasonDetail('');
    setClientError('');
  }, [current?.hourly_rate, open]);

  const draftRate = useMemo(() => {
    if (!effectiveFrom && !hourlyRate) return null;
    return {
      id: '__draft_hourly_rate__',
      hourly_rate: Number(hourlyRate || current?.hourly_rate || 0),
      effective_from: effectiveFrom || toDateInputValue(new Date()),
      effective_to: effectiveTo || null,
      status: 'upcoming',
    };
  }, [current?.hourly_rate, effectiveFrom, effectiveTo, hourlyRate]);

  const percentChange = useMemo(
    () => calculatePercentChange(current?.hourly_rate, hourlyRate),
    [current?.hourly_rate, hourlyRate],
  );

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = Number(hourlyRate);
    const detail = reasonDetail.trim();

    if (!Number.isFinite(value) || value <= 0) {
      setClientError('Mức tiền/giờ phải là số dương.');
      return;
    }
    if (value > MAX_RATE) {
      setClientError('Mức tiền/giờ không được vượt quá 10.000.000 VND.');
      return;
    }
    if (!effectiveFrom) {
      setClientError('Ngày bắt đầu áp dụng là bắt buộc.');
      return;
    }
    if (effectiveTo && effectiveTo < effectiveFrom) {
      setClientError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return;
    }
    if (!changeReason) {
      setClientError('Vui lòng chọn lý do thay đổi.');
      return;
    }
    if (!detail) {
      setClientError('Vui lòng nhập chi tiết lý do thay đổi.');
      return;
    }

    onSubmit?.({
      hourly_rate: value,
      currency: 'VND',
      effective_from: effectiveFrom,
      effective_to: effectiveTo || undefined,
      note: composeChangeNote(changeReason, detail),
    });
  };

  const changeClass =
    percentChange === null ? 'text-slate-500' : percentChange >= 0 ? 'text-emerald-600' : 'text-red-600';
  const changeText =
    percentChange === null
      ? 'Chưa xác định'
      : `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2).replace('.', ',')}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-3 lg:items-center">
      <div className="w-full max-w-[860px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
          <h3 className="text-[13px] font-extrabold text-slate-950">Tạo phiên bản mới</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid max-h-[72vh] overflow-y-auto text-[12px] md:grid-cols-[1fr_1.08fr]">
            <section className="space-y-3 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
                Thông tin cấu hình
              </h4>

              <label className="block">
                <span className={labelClass}>
                  Mức tiền/giờ (VNĐ) <b className="text-red-600">*</b>
                </span>
                <input
                  type="number"
                  min="1"
                  max={MAX_RATE}
                  step="1"
                  value={hourlyRate}
                  onChange={(event) => {
                    setHourlyRate(event.target.value);
                    setClientError('');
                  }}
                  className={inputClass}
                  placeholder="400000"
                  required
                />
              </label>

              <label className="block">
                <span className={labelClass}>
                  Hiệu lực từ <b className="text-red-600">*</b>
                </span>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(event) => {
                    setEffectiveFrom(event.target.value);
                    setClientError('');
                  }}
                  className={inputClass}
                  required
                />
              </label>

              <label className="block">
                <span className={labelClass}>Hiệu lực đến</span>
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={(event) => {
                    setEffectiveTo(event.target.value);
                    setClientError('');
                  }}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>
                  Lý do thay đổi <b className="text-red-600">*</b>
                </span>
                <select
                  value={changeReason}
                  onChange={(event) => {
                    setChangeReason(event.target.value);
                    setClientError('');
                  }}
                  className={inputClass}
                  required
                >
                  {CHANGE_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>
                  Chi tiết lý do <b className="text-red-600">*</b>
                </span>
                <textarea
                  value={reasonDetail}
                  onChange={(event) => {
                    setReasonDetail(event.target.value.slice(0, DETAIL_LIMIT));
                    setClientError('');
                  }}
                  rows={5}
                  maxLength={DETAIL_LIMIT}
                  className="w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-[12px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập chi tiết lý do thay đổi..."
                  required
                />
                <span className="mt-1 block text-right text-[10px] text-slate-500">
                  {reasonDetail.length}/{DETAIL_LIMIT}
                </span>
              </label>

              {(clientError || error) && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{clientError || error}</span>
                </div>
              )}
            </section>

            <section className="space-y-5 p-4">
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
                  Dòng thời gian xem trước
                </h4>
                <div className="mt-2">
                  <VersionTimeline
                    rates={rates}
                    draftRate={draftRate}
                    selectedId={draftRate?.id}
                    limit={3}
                    className="min-h-[112px]"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
                  Tác động dự kiến
                </h4>
                <dl className="mt-4 grid grid-cols-[150px_1fr] gap-y-2 text-[11px]">
                  <dt className="text-slate-500">Bắt đầu áp dụng</dt>
                  <dd className="font-extrabold text-slate-950">{formatDate(effectiveFrom)}</dd>
                  <dt className="text-slate-500">Mức hiện tại</dt>
                  <dd className="font-extrabold text-slate-950">
                    {current ? `${formatVnd(current.hourly_rate)} / giờ` : 'Chưa thiết lập'}
                  </dd>
                  <dt className="text-slate-500">Mức mới</dt>
                  <dd className="font-extrabold text-slate-950">
                    {hourlyRate ? `${formatVnd(hourlyRate)} / giờ` : 'Chưa nhập'}
                  </dd>
                  <dt className="text-slate-500">Nhân sự ảnh hưởng</dt>
                  <dd className="font-extrabold text-slate-950">Chưa xác định</dd>
                  <dt className="text-slate-500">Tác động ước tính</dt>
                  <dd className={`font-extrabold ${changeClass}`}>{changeText}</dd>
                </dl>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 min-w-[110px] rounded-md border border-slate-200 bg-white px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 min-w-[170px] rounded-md bg-slate-950 px-5 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Đang kiểm tra...' : 'Kiểm tra xung đột'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HourlyRateFormDialog;
