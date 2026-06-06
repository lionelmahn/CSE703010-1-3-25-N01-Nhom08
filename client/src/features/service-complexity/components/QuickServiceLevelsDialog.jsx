import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CHANGE_REASON_OPTIONS, PROCESSING_LEVEL_OPTIONS } from '../constants';
import { serviceLabel, todayInputValue } from '../utils';

const defaultRows = () => PROCESSING_LEVEL_OPTIONS.map((level) => ({
  processing_level: level.value,
  coefficient: level.defaultValue.toFixed(2),
}));

const ruleFor = (level) => PROCESSING_LEVEL_OPTIONS.find((item) => item.value === level) || PROCESSING_LEVEL_OPTIONS[0];

const QuickServiceLevelsDialog = ({ open, service, options, onClose, onSubmit, saving, error }) => {
  const [serviceId, setServiceId] = useState('');
  const [rows, setRows] = useState(defaultRows);
  const [effectiveFrom, setEffectiveFrom] = useState(todayInputValue());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [changeReason, setChangeReason] = useState('policy_change');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  const services = options?.services || [];
  const selectedService = useMemo(
    () => services.find((item) => String(item.id) === String(serviceId)) || service,
    [service, serviceId, services],
  );

  useEffect(() => {
    if (!open) return;
    setServiceId(service?.id ? String(service.id) : '');
    setRows(defaultRows());
    setEffectiveFrom(todayInputValue());
    setEffectiveTo('');
    setChangeReason('policy_change');
    setNote('');
    setLocalError('');
  }, [open, service]);

  const close = () => {
    if (!saving) onClose?.();
  };

  const updateCoefficient = (level, value) => {
    setRows((prev) => prev.map((row) => (
      row.processing_level === level ? { ...row, coefficient: value } : row
    )));
  };

  const submit = () => {
    if (!serviceId) {
      setLocalError('Vui lòng chọn dịch vụ.');
      return;
    }
    if (!effectiveFrom) {
      setLocalError('Vui lòng chọn ngày bắt đầu hiệu lực.');
      return;
    }

    const invalid = rows.find((row) => {
      const value = Number(row.coefficient);
      const rule = ruleFor(row.processing_level);
      return !Number.isFinite(value) || value < rule.min || value > rule.max;
    });

    if (invalid) {
      const rule = ruleFor(invalid.processing_level);
      setLocalError(`${rule.label} phải nằm trong khoảng ${rule.min.toFixed(2)} - ${rule.max.toFixed(2)}.`);
      return;
    }

    setLocalError('');
    onSubmit?.({
      items: rows.map((row) => ({
        service_id: Number(serviceId),
        processing_level: row.processing_level,
        coefficient: Number(row.coefficient),
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        change_reason: changeReason || null,
        note: note || null,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[92vh] max-w-[760px] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Cấu hình nhanh 4 mức</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[12px]">
          {(localError || error) ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{localError || error}</div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Dịch vụ *</span>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((item) => (
                  <option key={item.id} value={String(item.id)}>{serviceLabel(item)}</option>
                ))}
              </select>
              {selectedService ? <span className="mt-1 block text-[11px] text-slate-500">{selectedService.group?.name || ''}</span> : null}
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Lý do thay đổi</span>
              <select
                value={changeReason}
                onChange={(event) => setChangeReason(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              >
                {CHANGE_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Hiệu lực từ *</span>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Hiệu lực đến</span>
              <input
                type="date"
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 px-3"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-[520px] w-full text-[12px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Mức xử lý</th>
                  <th className="px-3 py-3">Range</th>
                  <th className="px-3 py-3 text-right">Hệ số cộng thêm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const rule = ruleFor(row.processing_level);
                  return (
                    <tr key={row.processing_level}>
                      <td className="px-3 py-3 font-semibold text-slate-900">{rule.label}</td>
                      <td className="px-3 py-3 text-slate-500">{rule.min.toFixed(2)} - {rule.max.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={rule.min}
                          max={rule.max}
                          step="0.01"
                          value={row.coefficient}
                          onChange={(event) => updateCoefficient(row.processing_level, event.target.value)}
                          className="h-9 w-28 rounded-md border border-slate-200 px-2 text-right font-semibold"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Ghi chú</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              className="h-20 w-full rounded-md border border-slate-200 p-3"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} disabled={saving} className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700">
              Hủy
            </button>
            <button type="button" onClick={submit} disabled={saving} className="h-10 rounded-md bg-slate-950 px-4 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu 4 mức'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickServiceLevelsDialog;
