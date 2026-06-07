/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCoefficient, formatDate } from '../utils';

const StopQualificationDialog = ({ open, coefficient, onClose, onSubmit, saving, error }) => {
  const [effectiveTo, setEffectiveTo] = useState('');
  const [reason, setReason] = useState('policy_changed');
  const [reasonDetail, setReasonDetail] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setEffectiveTo('');
    setReason('policy_changed');
    setReasonDetail('');
    setLocalError('');
  }, [open]);

  const submit = () => {
    if (!reason.trim()) {
      setLocalError('Vui lòng nhập lý do ngừng áp dụng.');
      return;
    }
    setLocalError('');
    onSubmit?.({
      effective_to: effectiveTo || null,
      reason,
      reason_detail: reasonDetail || null,
    });
  };

  const close = () => {
    if (!saving) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[560px] gap-0 overflow-hidden rounded-xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase text-slate-950">
            Ngừng áp dụng cấu hình
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 text-[12px]">
          {(localError || error) ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {localError || error}
            </div>
          ) : null}
          {coefficient ? (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="font-bold text-slate-950">{coefficient.qualification_name} · {formatCoefficient(coefficient.coefficient)}</div>
              <div className="mt-1 text-slate-500">{formatDate(coefficient.effective_from)} - {formatDate(coefficient.effective_to)}</div>
            </div>
          ) : null}
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ngày ngừng áp dụng</span>
              <input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Lý do *</span>
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]">
                <option value="policy_changed">Thay đổi chính sách</option>
                <option value="correction">Điều chỉnh sai sót</option>
                <option value="not_applicable">Không còn áp dụng</option>
                <option value="other">Khác</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-600">Chi tiết</span>
              <textarea value={reasonDetail} maxLength={255} onChange={(event) => setReasonDetail(event.target.value)} className="h-20 w-full resize-none rounded-md border border-slate-200 p-3 text-[12px]" />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={close} disabled={saving} className="h-10 rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Hủy
          </button>
          <button type="button" onClick={submit} disabled={saving} className="h-10 rounded-md bg-red-600 px-5 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Ngừng áp dụng'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StopQualificationDialog;
