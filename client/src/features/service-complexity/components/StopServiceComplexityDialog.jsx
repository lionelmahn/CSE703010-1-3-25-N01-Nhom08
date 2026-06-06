import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, levelLabel, serviceLabel, todayInputValue } from '../utils';

const StopServiceComplexityDialog = ({ open, coefficient, onClose, onSubmit, saving, error }) => {
  const [effectiveTo, setEffectiveTo] = useState(todayInputValue());
  const [reason, setReason] = useState('policy_changed');
  const [reasonDetail, setReasonDetail] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setEffectiveTo(todayInputValue());
    setReason('policy_changed');
    setReasonDetail('');
    setLocalError('');
  }, [open]);

  const close = () => {
    if (!saving) onClose?.();
  };

  const submit = () => {
    if (!reason.trim()) {
      setLocalError('Vui lòng nhập lý do ngừng áp dụng.');
      return;
    }
    setLocalError('');
    onSubmit?.({
      effective_to: effectiveTo || null,
      reason: reason.trim(),
      reason_detail: reasonDetail.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-w-[520px] bg-white">
        <DialogHeader>
          <DialogTitle>Ngừng áp dụng hệ số</DialogTitle>
        </DialogHeader>
        {coefficient ? (
          <div className="space-y-4 text-[12px]">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="font-bold text-slate-950">{coefficient.code} - {serviceLabel(coefficient.service)}</div>
              <div className="mt-1 text-slate-600">
                {levelLabel(coefficient.processing_level)} | +{Number(coefficient.coefficient || 0).toFixed(2)} | {formatDate(coefficient.effective_from)}
              </div>
            </div>
            {(localError || error) ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{localError || error}</div>
            ) : null}
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Ngày ngừng</span>
              <input
                type="date"
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Lý do *</span>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Chi tiết</span>
              <textarea
                value={reasonDetail}
                onChange={(event) => setReasonDetail(event.target.value)}
                maxLength={255}
                className="h-24 w-full rounded-md border border-slate-200 p-3"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} disabled={saving} className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700">
                Hủy
              </button>
              <button type="button" onClick={submit} disabled={saving} className="h-10 rounded-md bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {saving ? 'Đang xử lý...' : 'Ngừng áp dụng'}
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default StopServiceComplexityDialog;
