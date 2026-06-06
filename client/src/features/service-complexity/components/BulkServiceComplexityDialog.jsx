import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CHANGE_REASON_OPTIONS, PROCESSING_LEVEL_OPTIONS } from '../constants';
import { serviceLabel, serviceStatusClassName, serviceStatusLabel, todayInputValue } from '../utils';

const ruleFor = (level) => PROCESSING_LEVEL_OPTIONS.find((item) => item.value === level) || PROCESSING_LEVEL_OPTIONS[0];

const buildMatrix = (services) => {
  const matrix = {};
  services.forEach((service) => {
    matrix[service.id] = {};
    PROCESSING_LEVEL_OPTIONS.forEach((level) => {
      matrix[service.id][level.value] = level.defaultValue.toFixed(2);
    });
  });
  return matrix;
};

const BulkServiceComplexityDialog = ({ open, options, onClose, onSubmit, saving, error }) => {
  const services = options?.services || [];
  const [selectedIds, setSelectedIds] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [effectiveFrom, setEffectiveFrom] = useState(todayInputValue());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [changeReason, setChangeReason] = useState('policy_change');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    const defaults = services.slice(0, 5).map((service) => String(service.id));
    setSelectedIds(defaults);
    setMatrix(buildMatrix(services));
    setEffectiveFrom(todayInputValue());
    setEffectiveTo('');
    setChangeReason('policy_change');
    setNote('');
    setLocalError('');
  }, [open, services]);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(String(service.id))).slice(0, 20),
    [selectedIds, services],
  );

  const close = () => {
    if (!saving) onClose?.();
  };

  const toggleService = (id) => {
    setSelectedIds((prev) => {
      const key = String(id);
      if (prev.includes(key)) return prev.filter((item) => item !== key);
      if (prev.length >= 20) return prev;
      return [...prev, key];
    });
  };

  const updateCoefficient = (serviceId, level, value) => {
    setMatrix((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {}),
        [level]: value,
      },
    }));
  };

  const submit = () => {
    if (selectedServices.length === 0) {
      setLocalError('Vui lòng chọn ít nhất 1 dịch vụ.');
      return;
    }
    if (!effectiveFrom) {
      setLocalError('Vui lòng chọn ngày bắt đầu hiệu lực.');
      return;
    }

    for (const service of selectedServices) {
      for (const level of PROCESSING_LEVEL_OPTIONS) {
        const value = Number(matrix[service.id]?.[level.value]);
        const rule = ruleFor(level.value);
        if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
          setLocalError(`${serviceLabel(service)} - ${rule.label} phải trong khoảng ${rule.min.toFixed(2)} - ${rule.max.toFixed(2)}.`);
          return;
        }
      }
    }

    const items = selectedServices.flatMap((service) => (
      PROCESSING_LEVEL_OPTIONS.map((level) => ({
        service_id: service.id,
        processing_level: level.value,
        coefficient: Number(matrix[service.id][level.value]),
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        change_reason: changeReason || null,
        note: note || null,
      }))
    ));

    setLocalError('');
    onSubmit?.({ items });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[1180px] gap-0 overflow-hidden rounded-xl bg-white p-0 sm:w-[calc(100vw-32px)]">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-slate-950">
            Nhập hệ số phức tạp hàng loạt
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92vh-116px)] overflow-y-auto p-4 text-[12px]">
          {(localError || error) ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{localError || error}</div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[11px] font-extrabold uppercase text-slate-950">Chọn dịch vụ</h4>
                <span className="text-[10px] text-slate-500">{selectedServices.length}/20</span>
              </div>
              <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                {services.map((service) => (
                  <label key={service.id} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(service.id))}
                      onChange={() => toggleService(service.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">{service.service_code || `DV${service.id}`} - {service.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        <span>{service.group?.name || '-'}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 font-semibold ${serviceStatusClassName(service.status)}`}>
                          {serviceStatusLabel(service.status)}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </aside>

            <section className="min-w-0 space-y-4">
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hiệu lực từ *</span>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(event) => setEffectiveFrom(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hiệu lực đến</span>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(event) => setEffectiveTo(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Lý do</span>
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
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ghi chú</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                  />
                </label>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[760px] w-full table-fixed text-[12px]">
                  <colgroup>
                    <col className="w-[260px]" />
                    {PROCESSING_LEVEL_OPTIONS.map((level) => <col key={level.value} />)}
                  </colgroup>
                  <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Dịch vụ</th>
                      {PROCESSING_LEVEL_OPTIONS.map((level) => (
                        <th key={level.value} className="px-3 py-3 text-right">{level.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedServices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">Chọn dịch vụ để nhập ma trận.</td>
                      </tr>
                    ) : null}
                    {selectedServices.map((service) => (
                      <tr key={service.id}>
                        <th className="px-3 py-3 text-left font-semibold text-slate-900">{serviceLabel(service)}</th>
                        {PROCESSING_LEVEL_OPTIONS.map((level) => (
                          <td key={level.value} className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min={level.min}
                              max={level.max}
                              step="0.01"
                              value={matrix[service.id]?.[level.value] ?? level.defaultValue.toFixed(2)}
                              onChange={(event) => updateCoefficient(service.id, level.value, event.target.value)}
                              className="h-9 w-full rounded-md border border-slate-200 px-2 text-right font-semibold"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={close} disabled={saving} className="h-10 min-w-20 rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Hủy
          </button>
          <button type="button" onClick={submit} disabled={saving} className="h-10 min-w-32 rounded-md bg-slate-950 px-5 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu ma trận'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkServiceComplexityDialog;
