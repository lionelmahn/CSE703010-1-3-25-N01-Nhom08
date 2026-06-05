import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CHANGE_REASON_OPTIONS, DAY_TYPE_OPTIONS, SHIFT_TYPE_OPTIONS } from '../constants';
import { shiftTypeLabel, todayInputValue } from '../utils';

const MATRIX_DEFAULTS = {
  weekday: { morning: '1.00', afternoon: '1.00', evening: '1.20', custom: '1.00' },
  saturday: { morning: '1.10', afternoon: '1.10', evening: '1.30', custom: '1.10' },
  sunday: { morning: '1.30', afternoon: '1.30', evening: '1.50', custom: '1.30' },
  holiday: { morning: '1.50', afternoon: '1.50', evening: '2.00', custom: '1.50' },
};

const resetMatrix = () => JSON.parse(JSON.stringify(MATRIX_DEFAULTS));

const BulkCoefficientDialog = ({ open, onClose, onSubmit, saving, error }) => {
  const [matrix, setMatrix] = useState(resetMatrix);
  const [effectiveFrom, setEffectiveFrom] = useState(todayInputValue());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [changeReason, setChangeReason] = useState('policy_change');
  const [reasonDetail, setReasonDetail] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatrix(resetMatrix());
    setEffectiveFrom(todayInputValue());
    setEffectiveTo('');
    setChangeReason('policy_change');
    setReasonDetail('');
    setLocalError('');
  }, [open]);

  const summary = useMemo(() => ({
    dayTypes: DAY_TYPE_OPTIONS.length,
    shiftTypes: SHIFT_TYPE_OPTIONS.length,
    records: DAY_TYPE_OPTIONS.length * SHIFT_TYPE_OPTIONS.length,
    conflicts: 0,
  }), []);

  const updateCoefficient = (dayType, shiftType, value) => {
    setMatrix((prev) => ({
      ...prev,
      [dayType]: {
        ...prev[dayType],
        [shiftType]: value,
      },
    }));
  };

  const submit = () => {
    if (!effectiveFrom) {
      setLocalError('Vui lòng chọn ngày bắt đầu áp dụng.');
      return;
    }

    const invalidCell = DAY_TYPE_OPTIONS.some((day) =>
      SHIFT_TYPE_OPTIONS.some((shift) => {
        const value = Number(matrix[day.value]?.[shift.value]);
        return !Number.isFinite(value) || value < 1 || value > 2;
      }),
    );

    if (invalidCell) {
      setLocalError('Tất cả hệ số trong bảng phải nằm trong khoảng 1.00 đến 2.00.');
      return;
    }

    const items = DAY_TYPE_OPTIONS.flatMap((day) =>
      SHIFT_TYPE_OPTIONS.map((shift) => ({
        name: `${day.label} - ${shiftTypeLabel(shift.value)}`,
        day_type: day.value,
        shift_type: shift.value,
        coefficient: Number(matrix[day.value][shift.value]),
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        change_reason: changeReason || null,
        note: reasonDetail || null,
      })),
    );

    setLocalError('');
    onSubmit?.({ items });
  };

  const close = () => {
    if (!saving) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[1180px] gap-0 overflow-hidden rounded-xl bg-white p-0 sm:w-[calc(100vw-32px)]">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-slate-950">
            Nhập hệ số hàng loạt
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92vh-116px)] overflow-y-auto px-4 py-4 text-[12px]">
          {(localError || error) && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {localError || error}
            </div>
          )}

          <div className="grid gap-4 2xl:grid-cols-[minmax(760px,1fr)_300px]">
            <section className="min-w-0">
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[640px] table-fixed text-[12px]">
                  <colgroup>
                    <col className="w-[150px]" />
                    {SHIFT_TYPE_OPTIONS.map((shift) => (
                      <col key={shift.value} />
                    ))}
                  </colgroup>
                  <thead className="bg-slate-50 text-slate-950">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-3 text-left font-extrabold">Loại ngày</th>
                      {SHIFT_TYPE_OPTIONS.map((shift) => (
                        <th key={shift.value} className="px-2 py-3 text-center font-extrabold">
                          {shift.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DAY_TYPE_OPTIONS.map((day) => (
                      <tr key={day.value}>
                        <th className="px-3 py-3 text-left align-middle font-semibold text-slate-950">
                          <span className="block">{day.label}</span>
                          {day.description && <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{day.description}</span>}
                        </th>
                        {SHIFT_TYPE_OPTIONS.map((shift) => (
                          <td key={shift.value} className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              max="2"
                              step="0.01"
                              value={matrix[day.value]?.[shift.value] ?? '1.00'}
                              onChange={(event) => updateCoefficient(day.value, shift.value, event.target.value)}
                              className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-center text-[12px] font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] 2xl:flex 2xl:flex-col">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-[11px] font-extrabold uppercase text-slate-950">Thông tin hiệu lực</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1">
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
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ghi chú</span>
                  <textarea
                    value={reasonDetail}
                    onChange={(event) => setReasonDetail(event.target.value)}
                    maxLength={255}
                    className="h-20 w-full resize-none rounded-md border border-slate-200 p-3 text-[12px] lg:h-16 2xl:h-24"
                    placeholder="Điều chỉnh theo chính sách lương"
                  />
                  <span className="float-right text-[10px] text-slate-500">{reasonDetail.length}/255</span>
                </label>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:self-start 2xl:self-auto">
                <h4 className="mb-3 text-[11px] font-extrabold uppercase text-slate-950">Tóm tắt</h4>
                <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[12px]">
                  <dt className="text-slate-600">Loại ngày:</dt>
                  <dd className="font-extrabold text-slate-950">{summary.dayTypes}</dd>
                  <dt className="text-slate-600">Loại ca:</dt>
                  <dd className="font-extrabold text-slate-950">{summary.shiftTypes}</dd>
                  <dt className="text-slate-600">Cấu hình sẽ tạo:</dt>
                  <dd className="font-extrabold text-slate-950">{summary.records}</dd>
                  <dt className="text-slate-600">Xung đột tìm thấy:</dt>
                  <dd className="font-extrabold text-slate-950">{summary.conflicts}</dd>
                </dl>
              </section>
            </aside>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="h-10 min-w-20 rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="h-10 min-w-32 rounded-md bg-slate-950 px-5 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu hàng loạt'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCoefficientDialog;
