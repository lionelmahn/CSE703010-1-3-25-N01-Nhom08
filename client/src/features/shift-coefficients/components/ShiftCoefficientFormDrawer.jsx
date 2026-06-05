import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CHANGE_REASON_OPTIONS, DAY_TYPE_OPTIONS, SHIFT_TYPE_OPTIONS } from '../constants';
import { todayInputValue } from '../utils';

const emptyForm = {
  name: '',
  day_type: 'weekday',
  shift_type: 'morning',
  coefficient: '1.00',
  effective_from: todayInputValue(),
  effective_to: '',
  change_reason: 'policy_change',
  note: '',
};

const ShiftCoefficientFormDrawer = ({ open, initialValues, onClose, onSubmit, saving, error }) => {
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalError('');
    setForm({
      ...emptyForm,
      ...(initialValues || {}),
      name: initialValues?.name || '',
      coefficient: initialValues?.coefficient ? String(initialValues.coefficient) : '1.00',
      effective_from: initialValues?.effective_from || todayInputValue(),
    });
  }, [initialValues, open]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    const coefficient = Number(form.coefficient);

    if (!form.name.trim()) {
      setLocalError('Vui lòng nhập tên cấu hình.');
      return;
    }
    if (!Number.isFinite(coefficient) || coefficient < 1 || coefficient > 2) {
      setLocalError('Hệ số ca phải từ 1.00 đến 2.00.');
      return;
    }
    if (!form.effective_from) {
      setLocalError('Vui lòng chọn ngày bắt đầu áp dụng.');
      return;
    }

    setLocalError('');
    onSubmit?.({
      name: form.name.trim(),
      day_type: form.day_type,
      shift_type: form.shift_type,
      coefficient,
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
      change_reason: form.change_reason || null,
      note: form.note || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <form onSubmit={submit} className="h-full w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
          <h3 className="text-[14px] font-extrabold text-slate-950">Tạo phiên bản hệ số ca</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-[12px]">
          {(localError || error) && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {localError || error}
            </div>
          )}

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Tên cấu hình *</span>
            <input
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3"
              placeholder="VD: Thứ 7 ca tối từ 01/07"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Loại ngày *</span>
              <select
                value={form.day_type}
                onChange={(event) => update('day_type', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              >
                {DAY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Loại ca *</span>
              <select
                value={form.shift_type}
                onChange={(event) => update('shift_type', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              >
                {SHIFT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Hệ số ca *</span>
            <input
              type="number"
              min="1"
              max="2"
              step="0.01"
              value={form.coefficient}
              onChange={(event) => update('coefficient', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Hiệu lực từ *</span>
              <input
                type="date"
                value={form.effective_from}
                onChange={(event) => update('effective_from', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Hiệu lực đến</span>
              <input
                type="date"
                value={form.effective_to}
                onChange={(event) => update('effective_to', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Lý do thay đổi</span>
            <select
              value={form.change_reason}
              onChange={(event) => update('change_reason', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3"
            >
              {CHANGE_REASON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Ghi chú</span>
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              className="min-h-24 w-full rounded-md border border-slate-200 p-3"
              maxLength={500}
            />
          </label>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShiftCoefficientFormDrawer;
