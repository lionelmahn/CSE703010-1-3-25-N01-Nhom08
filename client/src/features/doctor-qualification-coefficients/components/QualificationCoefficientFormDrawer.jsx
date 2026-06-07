/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CHANGE_REASON_OPTIONS } from '../constants';
import { formatCoefficient, qualificationByCode, qualificationsFromOptions, todayInputValue, typeLabel } from '../utils';

const QualificationCoefficientFormDrawer = ({
  open,
  initialValues,
  options,
  onClose,
  onSubmit,
  saving,
  error,
}) => {
  const qualifications = useMemo(() => qualificationsFromOptions(options), [options]);
  const [qualificationCode, setQualificationCode] = useState('');
  const [qualificationType, setQualificationType] = useState('');
  const [priority, setPriority] = useState('');
  const [coefficient, setCoefficient] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayInputValue());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [changeReason, setChangeReason] = useState('policy_change');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    const preset = initialValues || {};
    const selected = qualificationByCode(qualifications, preset.qualification_code) || qualifications[0];
    setQualificationCode(preset.qualification_code || selected?.code || '');
    setQualificationType(preset.qualification_type || selected?.type || '');
    setPriority(String(preset.priority || selected?.priority || ''));
    setCoefficient(String(preset.coefficient || selected?.default_coefficient || ''));
    setEffectiveFrom(preset.effective_from || todayInputValue());
    setEffectiveTo(preset.effective_to || '');
    setChangeReason(preset.change_reason || 'policy_change');
    setNote(preset.note || '');
    setLocalError('');
  }, [initialValues, open, qualifications]);

  const selectedQualification = qualificationByCode(qualifications, qualificationCode);

  const selectQualification = (code) => {
    const next = qualificationByCode(qualifications, code);
    setQualificationCode(code);
    setQualificationType(next?.type || '');
    setPriority(String(next?.priority || ''));
    if (!coefficient || Number(coefficient) === 1) {
      setCoefficient(String(next?.default_coefficient || 1));
    }
  };

  const submit = () => {
    const numericCoefficient = Number(coefficient);
    if (!qualificationCode || !qualificationType) {
      setLocalError('Vui lòng chọn học hàm/học vị.');
      return;
    }
    if (!Number.isFinite(numericCoefficient) || numericCoefficient < 1 || numericCoefficient > 3) {
      setLocalError('Hệ số bác sĩ phải nằm trong khoảng 1.00 đến 3.00.');
      return;
    }
    if (!effectiveFrom) {
      setLocalError('Vui lòng chọn ngày bắt đầu áp dụng.');
      return;
    }
    if (effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
      setLocalError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return;
    }

    setLocalError('');
    onSubmit?.({
      qualification_code: qualificationCode,
      qualification_type: qualificationType,
      priority: priority ? Number(priority) : null,
      coefficient: numericCoefficient,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || null,
      change_reason: changeReason || null,
      note: note || null,
    });
  };

  const close = () => {
    if (!saving) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[720px] gap-0 overflow-hidden rounded-xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase text-slate-950">
            Tạo phiên bản hệ số bác sĩ
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92vh-116px)] overflow-y-auto p-4 text-[12px]">
          {(localError || error) ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {localError || error}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Học hàm/học vị *</span>
              <select
                value={qualificationCode}
                onChange={(event) => selectQualification(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]"
              >
                {qualifications.map((item) => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </label>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <span className="block text-[11px] font-semibold text-slate-500">Loại trình độ</span>
              <span className="mt-1 block font-bold text-slate-950">{typeLabel(qualificationType)}</span>
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Thứ tự ưu tiên</span>
              <input
                type="number"
                min="1"
                max="99"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hệ số bác sĩ *</span>
              <input
                type="number"
                min="1"
                max="3"
                step="0.01"
                value={coefficient}
                onChange={(event) => setCoefficient(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px] font-semibold"
              />
              {selectedQualification ? (
                <span className="mt-1 block text-[10px] text-slate-500">
                  Gợi ý: {formatCoefficient(selectedQualification.default_coefficient)}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Lý do thay đổi</span>
              <select
                value={changeReason}
                onChange={(event) => setChangeReason(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]"
              >
                {CHANGE_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hiệu lực từ *</span>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hiệu lực đến</span>
              <input
                type="date"
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ghi chú</span>
              <textarea
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                className="h-24 w-full resize-none rounded-md border border-slate-200 p-3 text-[12px]"
              />
              <span className="float-right text-[10px] text-slate-500">{note.length}/500</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={close} disabled={saving} className="h-10 rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Hủy
          </button>
          <button type="button" onClick={submit} disabled={saving} className="h-10 rounded-md bg-blue-600 px-5 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu phiên bản'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QualificationCoefficientFormDrawer;
