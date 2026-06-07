/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CHANGE_REASON_OPTIONS } from '../constants';
import { qualificationsFromOptions, todayInputValue, typeLabel } from '../utils';

const BulkQualificationDialog = ({ open, options, onClose, onSubmit, saving, error }) => {
  const qualifications = useMemo(() => qualificationsFromOptions(options), [options]);
  const [values, setValues] = useState({});
  const [effectiveFrom, setEffectiveFrom] = useState(todayInputValue());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [changeReason, setChangeReason] = useState('policy_change');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    const nextValues = {};
    qualifications.forEach((item) => {
      nextValues[item.code] = String(item.default_coefficient || 1);
    });
    setValues(nextValues);
    setEffectiveFrom(todayInputValue());
    setEffectiveTo('');
    setChangeReason('policy_change');
    setNote('');
    setLocalError('');
  }, [open, qualifications]);

  const updateValue = (code, value) => {
    setValues((prev) => ({ ...prev, [code]: value }));
  };

  const submit = () => {
    if (!effectiveFrom) {
      setLocalError('Vui lòng chọn ngày bắt đầu áp dụng.');
      return;
    }
    if (effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
      setLocalError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return;
    }

    const invalid = qualifications.some((item) => {
      const value = Number(values[item.code]);
      return !Number.isFinite(value) || value < 1 || value > 3;
    });
    if (invalid) {
      setLocalError('Tất cả hệ số phải nằm trong khoảng 1.00 đến 3.00.');
      return;
    }

    setLocalError('');
    onSubmit?.({
      items: qualifications.map((item) => ({
        qualification_code: item.code,
        qualification_type: item.type,
        priority: item.priority,
        coefficient: Number(values[item.code]),
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        change_reason: changeReason || null,
        note: note || null,
      })),
    });
  };

  const close = () => {
    if (!saving) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[980px] gap-0 overflow-hidden rounded-xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase text-slate-950">
            Nhập hệ số học hàm/học vị hàng loạt
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92vh-116px)] overflow-y-auto p-4 text-[12px]">
          {(localError || error) ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {localError || error}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(620px,1fr)_280px]">
            <section className="min-w-0 overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[620px] table-fixed text-[12px]">
                <colgroup>
                  <col className="w-[210px]" />
                  <col className="w-[120px]" />
                  <col className="w-[90px]" />
                  <col />
                </colgroup>
                <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Học hàm/học vị</th>
                    <th className="px-3 py-3">Loại</th>
                    <th className="px-3 py-3 text-center">Ưu tiên</th>
                    <th className="px-3 py-3 text-center">Hệ số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qualifications.map((item) => (
                    <tr key={item.code}>
                      <th className="px-3 py-3 text-left">
                        <span className="block font-bold text-slate-950">{item.name}</span>
                        <span className="font-mono text-[10px] font-normal text-slate-500">{item.code}</span>
                      </th>
                      <td className="px-3 py-3">{typeLabel(item.type)}</td>
                      <td className="px-3 py-3 text-center font-bold">{item.priority}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          max="3"
                          step="0.01"
                          value={values[item.code] ?? ''}
                          onChange={(event) => updateValue(item.code, event.target.value)}
                          className="h-10 w-full rounded-md border border-slate-200 px-2 text-center text-[12px] font-semibold"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-[11px] font-extrabold uppercase text-slate-950">Thông tin hiệu lực</h4>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hiệu lực từ *</span>
                  <input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Hiệu lực đến</span>
                  <input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Lý do thay đổi</span>
                  <select value={changeReason} onChange={(event) => setChangeReason(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-[12px]">
                    {CHANGE_REASON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ghi chú</span>
                  <textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} className="h-24 w-full resize-none rounded-md border border-slate-200 p-3 text-[12px]" />
                </label>
                <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-slate-200 pt-3">
                  <dt className="text-slate-600">Dòng cấu hình</dt>
                  <dd className="font-extrabold text-slate-950">{qualifications.length}</dd>
                  <dt className="text-slate-600">Khoảng hợp lệ</dt>
                  <dd className="font-extrabold text-slate-950">1.00 - 3.00</dd>
                </dl>
              </div>
            </aside>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={close} disabled={saving} className="h-10 rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Hủy
          </button>
          <button type="button" onClick={submit} disabled={saving} className="h-10 rounded-md bg-slate-950 px-5 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu hàng loạt'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkQualificationDialog;
