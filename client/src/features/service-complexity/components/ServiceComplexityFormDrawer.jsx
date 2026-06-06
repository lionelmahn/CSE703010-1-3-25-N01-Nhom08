import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { CHANGE_REASON_OPTIONS, PROCESSING_LEVEL_OPTIONS } from '../constants';
import { serviceLabel, todayInputValue } from '../utils';

const emptyForm = {
  service_id: '',
  processing_level: 'thong_thuong',
  coefficient: '0.00',
  effective_from: todayInputValue(),
  effective_to: '',
  change_reason: 'policy_change',
  note: '',
};

const ruleFor = (level) => PROCESSING_LEVEL_OPTIONS.find((item) => item.value === level) || PROCESSING_LEVEL_OPTIONS[0];

const ServiceComplexityFormDrawer = ({ open, initialValues, options, onClose, onSubmit, saving, error }) => {
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState('');

  const services = options?.services || [];
  const levels = options?.processing_levels?.length ? options.processing_levels : PROCESSING_LEVEL_OPTIONS;
  const selectedRule = useMemo(() => ruleFor(form.processing_level), [form.processing_level]);

  useEffect(() => {
    if (!open) return;
    const nextLevel = initialValues?.processing_level || 'thong_thuong';
    const nextRule = ruleFor(nextLevel);
    setLocalError('');
    setForm({
      ...emptyForm,
      ...(initialValues || {}),
      service_id: initialValues?.service_id ? String(initialValues.service_id) : '',
      processing_level: nextLevel,
      coefficient: initialValues?.coefficient !== undefined ? String(initialValues.coefficient) : String(nextRule.defaultValue.toFixed(2)),
      effective_from: initialValues?.effective_from || todayInputValue(),
      effective_to: initialValues?.effective_to || '',
      change_reason: initialValues?.change_reason || 'policy_change',
      note: initialValues?.note || '',
    });
  }, [initialValues, open]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((prev) => {
      if (key === 'processing_level') {
        const nextRule = ruleFor(value);
        return { ...prev, processing_level: value, coefficient: nextRule.defaultValue.toFixed(2) };
      }
      return { ...prev, [key]: value };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const coefficient = Number(form.coefficient);
    if (!form.service_id) {
      setLocalError('Vui lòng chọn dịch vụ.');
      return;
    }
    if (!Number.isFinite(coefficient) || coefficient < selectedRule.min || coefficient > selectedRule.max) {
      setLocalError(`Hệ số ${selectedRule.label} phải trong khoảng ${selectedRule.min.toFixed(2)} - ${selectedRule.max.toFixed(2)}.`);
      return;
    }
    if (!form.effective_from) {
      setLocalError('Vui lòng chọn ngày bắt đầu hiệu lực.');
      return;
    }

    setLocalError('');
    onSubmit?.({
      service_id: Number(form.service_id),
      processing_level: form.processing_level,
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
          <h3 className="text-[14px] font-extrabold text-slate-950">Tạo phiên bản hệ số phức tạp</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-[12px]">
          {(localError || error) ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {localError || error}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Dịch vụ *</span>
            <select
              value={form.service_id}
              onChange={(event) => update('service_id', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>{serviceLabel(service)}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Mức xử lý *</span>
              <select
                value={form.processing_level}
                onChange={(event) => update('processing_level', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              >
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Hệ số cộng thêm *</span>
              <input
                type="number"
                min={selectedRule.min}
                max={selectedRule.max}
                step="0.01"
                value={form.coefficient}
                onChange={(event) => update('coefficient', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            Quy tắc: {selectedRule.label} = {selectedRule.min.toFixed(2)} - {selectedRule.max.toFixed(2)}. Hệ số là phần cộng thêm vào giá dịch vụ, không phải hệ số nhân 1.x.
          </div>

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
              {CHANGE_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Ghi chú</span>
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              maxLength={500}
              className="min-h-24 w-full rounded-md border border-slate-200 p-3"
            />
          </label>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700">
            Hủy
          </button>
          <button type="submit" disabled={saving} className="h-10 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceComplexityFormDrawer;
