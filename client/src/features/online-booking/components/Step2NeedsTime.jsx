import React, { useMemo } from 'react';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  BOOKING_NEEDS,
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  MAX_BOOKING_DAYS_AHEAD,
  NOTE_MAX_LENGTH,
  TIME_SLOTS,
} from '../data';
import { formatDateIso } from '../utils';

const FieldError = ({ message }) =>
  message ? (
    <p className="text-xs text-red-500 mt-1.5" role="alert">
      {message}
    </p>
  ) : null;

const Step2NeedsTime = ({ form, errors, onChange }) => {
  // Mốc ngày dùng cho input `min/max`. Tính một lần khi mount để tránh
  // re-eval khi component re-render (đồng thời thoả `react-hooks/purity`).
  const { today, maxDate } = useMemo(() => {
    const now = new Date();
    const max = new Date(now.getTime() + MAX_BOOKING_DAYS_AHEAD * 24 * 60 * 60 * 1000);
    return { today: formatDateIso(now), maxDate: formatDateIso(max) };
  }, []);

  const toggleService = (id, checked) => {
    const next = new Set(form.serviceIds || []);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onChange('serviceIds', Array.from(next));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 mb-4">
          Nhu cầu khám &amp; Dịch vụ quan tâm
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-3">
              Chọn nhu cầu khám <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3 text-sm text-gray-600">
              {BOOKING_NEEDS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="ob-need"
                    value={option.id}
                    checked={form.need === option.id}
                    onChange={() => onChange('need', option.id)}
                    className="w-4 h-4 accent-slate-800"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <FieldError message={errors.need} />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-3">
              Dịch vụ quan tâm{' '}
              <span className="text-gray-400 font-normal">
                (có thể chọn nhiều) <span className="text-red-500">*</span>
              </span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600">
              {BOOKING_SERVICES.map((svc) => {
                const checked = (form.serviceIds || []).includes(svc.id);
                return (
                  <label
                    key={svc.id}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      !svc.active && 'opacity-60 cursor-not-allowed',
                    )}
                    title={!svc.active ? 'Dịch vụ đang tạm ngừng' : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!svc.active}
                      onChange={(e) => toggleService(svc.id, e.target.checked)}
                      className="w-4 h-4 rounded accent-slate-800"
                    />
                    <span>
                      {svc.label}
                      {!svc.active && (
                        <span className="ml-1 text-[11px] text-gray-400">
                          (tạm ngừng)
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <FieldError message={errors.serviceIds} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-4">Thời gian mong muốn</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label
              htmlFor="ob-date"
              className="text-sm font-medium text-gray-700"
            >
              Ngày mong muốn <span className="text-red-500">*</span>
            </Label>
            <input
              id="ob-date"
              type="date"
              value={form.date || ''}
              min={today}
              max={maxDate}
              onChange={(e) => onChange('date', e.target.value)}
              aria-invalid={!!errors.date}
              className={cn(
                'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1.5 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                errors.date && 'border-red-400 focus-visible:ring-red-300',
              )}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Có thể đặt trong vòng {MAX_BOOKING_DAYS_AHEAD} ngày kể từ hôm nay.
            </p>
            <FieldError message={errors.date} />
          </div>

          <div>
            <Label
              htmlFor="ob-time"
              className="text-sm font-medium text-gray-700"
            >
              Khung giờ mong muốn <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.timeSlotId || ''}
              onValueChange={(v) => onChange('timeSlotId', v)}
            >
              <SelectTrigger
                id="ob-time"
                aria-invalid={!!errors.timeSlotId}
                className={cn(
                  'mt-1.5 rounded-lg',
                  errors.timeSlotId &&
                    'border-red-400 focus:ring-red-300',
                )}
              >
                <SelectValue placeholder="Chọn khung giờ" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem
                    key={slot.id}
                    value={slot.id}
                    disabled={slot.break}
                  >
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.timeSlotId} />
          </div>

          <div>
            <Label
              htmlFor="ob-branch"
              className="text-sm font-medium text-gray-700"
            >
              Chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.branchId || ''}
              onValueChange={(v) => onChange('branchId', v)}
            >
              <SelectTrigger
                id="ob-branch"
                aria-invalid={!!errors.branchId}
                className={cn(
                  'mt-1.5 rounded-lg',
                  errors.branchId && 'border-red-400 focus:ring-red-300',
                )}
              >
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {CLINIC_BRANCHES.map((branch) => (
                  <SelectItem
                    key={branch.id}
                    value={branch.id}
                    disabled={!branch.active}
                  >
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.branchId} />
          </div>
        </div>
      </div>

      <div>
        <Label
          htmlFor="ob-note"
          className="text-sm font-medium text-gray-700"
        >
          Ghi chú thêm (nếu có)
        </Label>
        <Textarea
          id="ob-note"
          value={form.note || ''}
          onChange={(e) => onChange('note', e.target.value)}
          placeholder="Nhập ghi chú của bạn..."
          maxLength={NOTE_MAX_LENGTH}
          rows={3}
          aria-invalid={!!errors.note}
          className={cn(
            'mt-1.5 rounded-lg',
            errors.note && 'border-red-400 focus-visible:ring-red-300',
          )}
        />
        <div className="flex justify-between mt-1">
          <FieldError message={errors.note} />
          <div className="text-[11px] text-gray-400 ml-auto">
            {(form.note || '').length}/{NOTE_MAX_LENGTH}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2NeedsTime;
