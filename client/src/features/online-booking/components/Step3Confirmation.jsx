import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  BOOKING_NEEDS,
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  TIME_SLOTS,
} from '../data';
import { formatDateVi, sanitizeNote } from '../utils';

const FieldError = ({ message }) =>
  message ? (
    <p className="text-xs text-red-500 mt-1.5" role="alert">
      {message}
    </p>
  ) : null;

const SummaryRow = ({ label, value }) => (
  <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 break-words">
      {value || <span className="text-gray-400 italic">(chưa nhập)</span>}
    </span>
  </div>
);

const Step3Confirmation = ({ form, errors, onChange }) => {
  const needLabel =
    BOOKING_NEEDS.find((n) => n.id === form.need)?.label || '';
  const serviceLabels = (form.serviceIds || [])
    .map((id) => BOOKING_SERVICES.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(', ');
  const slotLabel =
    TIME_SLOTS.find((s) => s.id === form.timeSlotId)?.label || '';
  const branchLabel =
    CLINIC_BRANCHES.find((b) => b.id === form.branchId)?.label || '';
  const sanitizedNote = sanitizeNote(form.note);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Xác nhận thông tin</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="font-bold text-gray-900 mb-1 border-b border-gray-200 pb-2">
              Thông tin cá nhân
            </div>
            <SummaryRow label="Họ và tên:" value={form.name} />
            <SummaryRow label="Số điện thoại:" value={form.phone} />
            <SummaryRow label="Email:" value={form.email} />
          </div>
          <div className="space-y-3">
            <div className="font-bold text-gray-900 mb-1 border-b border-gray-200 pb-2">
              Nhu cầu &amp; thời gian
            </div>
            <SummaryRow label="Nhu cầu khám:" value={needLabel} />
            <SummaryRow label="Dịch vụ:" value={serviceLabels} />
            <SummaryRow
              label="Ngày mong muốn:"
              value={formatDateVi(form.date)}
            />
            <SummaryRow label="Khung giờ:" value={slotLabel} />
            <SummaryRow label="Chi nhánh:" value={branchLabel} />
            <SummaryRow label="Ghi chú:" value={sanitizedNote} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2 cursor-pointer text-sm">
          <Checkbox
            id="ob-terms"
            checked={!!form.acceptedTerms}
            onCheckedChange={(checked) =>
              onChange('acceptedTerms', checked === true)
            }
            aria-invalid={!!errors.acceptedTerms}
            className={cn(
              'mt-0.5',
              errors.acceptedTerms && 'border-red-400',
            )}
          />
          <span>
            Tôi đã đọc và đồng ý với{' '}
            <a
              href="#"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Điều khoản xử lý dữ liệu cá nhân
            </a>{' '}
            <span className="text-red-500">*</span>
          </span>
        </label>
        <FieldError message={errors.acceptedTerms} />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 block mb-2">
          Xác thực chống spam <span className="text-red-500">*</span>
        </Label>
        <div className="border border-gray-300 rounded-lg p-3 flex items-center justify-between max-w-xs">
          <label
            htmlFor="ob-captcha"
            className="flex items-center gap-3 cursor-pointer"
          >
            <Checkbox
              id="ob-captcha"
              checked={!!form.captchaVerified}
              onCheckedChange={(checked) => {
                const ok = checked === true;
                onChange('captchaVerified', ok);
                onChange('captchaToken', ok ? `mock-${Date.now()}` : null);
              }}
              className="h-5 w-5"
            />
            <span className="text-sm font-medium text-gray-800">
              Tôi không phải là người máy
            </span>
          </label>
          <div className="flex flex-col items-center text-[10px] text-gray-500 leading-tight">
            <div className="font-semibold text-gray-700 text-xs">CAPTCHA</div>
            <div>Mô phỏng</div>
          </div>
        </div>
        <FieldError message={errors.captcha} />
      </div>
    </div>
  );
};

export default Step3Confirmation;
