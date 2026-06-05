import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dayTypeLabel, formatCoefficient, formatDate, shiftTypeLabel, todayInputValue } from '../utils';

const StopCoefficientDialog = ({ open, coefficient, onClose, onSubmit, saving, error }) => {
  const [form, setForm] = useState({ effective_to: todayInputValue(), reason: 'policy_changed', reason_detail: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ effective_to: todayInputValue(), reason: 'policy_changed', reason_detail: '' });
      setLocalError('');
    }
  }, [open]);

  const submit = () => {
    if (!form.reason.trim()) {
      setLocalError('Vui lòng nhập lý do ngừng áp dụng.');
      return;
    }
    setLocalError('');
    onSubmit?.({
      effective_to: form.effective_to || null,
      reason: form.reason,
      reason_detail: form.reason_detail || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Ngừng áp dụng hệ số ca</DialogTitle>
        </DialogHeader>

        {coefficient && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px]">
            <div className="grid grid-cols-[110px_1fr] gap-y-1">
              <span className="text-slate-500">Cấu hình</span><span className="font-semibold">{coefficient.code} - {coefficient.name}</span>
              <span className="text-slate-500">Phạm vi</span><span>{dayTypeLabel(coefficient.day_type)} / {shiftTypeLabel(coefficient.shift_type)}</span>
              <span className="text-slate-500">Hệ số</span><span>x{formatCoefficient(coefficient.coefficient)}</span>
              <span className="text-slate-500">Hiệu lực từ</span><span>{formatDate(coefficient.effective_from)}</span>
            </div>
          </div>
        )}

        {(localError || error) && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {localError || error}
          </div>
        )}

        <div className="space-y-3 text-[12px]">
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Dừng áp dụng từ ngày</span>
            <input
              type="date"
              value={form.effective_to}
              onChange={(event) => setForm((prev) => ({ ...prev, effective_to: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Lý do *</span>
            <select
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3"
            >
              <option value="policy_changed">Chính sách thay đổi</option>
              <option value="configuration_error">Cấu hình sai</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Chi tiết lý do</span>
            <textarea
              value={form.reason_detail}
              onChange={(event) => setForm((prev) => ({ ...prev, reason_detail: event.target.value }))}
              className="min-h-20 w-full rounded-md border border-slate-200 p-3"
              maxLength={255}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700">Hủy</button>
          <button type="button" onClick={submit} disabled={saving} className="h-10 rounded-md bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Xác nhận ngừng'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StopCoefficientDialog;
