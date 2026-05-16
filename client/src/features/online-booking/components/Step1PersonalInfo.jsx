import React from 'react';
import { Info } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FieldError = ({ message }) =>
  message ? (
    <p className="text-xs text-red-500 mt-1.5" role="alert">
      {message}
    </p>
  ) : null;

const Step1PersonalInfo = ({ form, errors, onChange }) => {
  const handle = (field) => (event) => onChange(field, event.target.value);

  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-4">Thông tin cá nhân</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label
            htmlFor="ob-name"
            className="text-sm font-medium text-gray-700"
          >
            Họ và tên <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ob-name"
            value={form.name}
            onChange={handle('name')}
            placeholder="Nhập họ và tên"
            autoComplete="name"
            aria-invalid={!!errors.name}
            className={cn(
              'mt-1.5 rounded-lg',
              errors.name && 'border-red-400 focus-visible:ring-red-300'
            )}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <Label
            htmlFor="ob-phone"
            className="text-sm font-medium text-gray-700"
          >
            Số điện thoại <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ob-phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={handle('phone')}
            placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            className={cn(
              'mt-1.5 rounded-lg',
              errors.phone && 'border-red-400 focus-visible:ring-red-300'
            )}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="md:col-span-2">
          <Label
            htmlFor="ob-email"
            className="text-sm font-medium text-gray-700"
          >
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ob-email"
            type="email"
            value={form.email}
            onChange={handle('email')}
            placeholder="ban@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={cn(
              'mt-1.5 rounded-lg',
              errors.email && 'border-red-400 focus-visible:ring-red-300'
            )}
          />
          <FieldError message={errors.email} />
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-500 mt-2">
        <Info className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
        <p>
          Thông tin của bạn sẽ được bảo mật và chỉ sử dụng để liên hệ xác nhận
          lịch hẹn.
        </p>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;
