import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { onlineBookingApi } from '@/api/onlineBookingApi';
import StepIndicator from './StepIndicator';
import Step1PersonalInfo from './Step1PersonalInfo';
import Step2NeedsTime from './Step2NeedsTime';
import Step3Confirmation from './Step3Confirmation';
import Step4Success from './Step4Success';
import { INITIAL_BOOKING_FORM, SOURCE_LANDING_PAGE } from '../data';
import {
  buildBookingPayload,
  validateAll,
  validateStep1,
  validateStep2,
  validateStep3,
} from '../validation';

/**
 * UC6.1 - Multi-step booking request wizard.
 *
 * Tách khỏi BookingPage để có thể vừa dùng độc lập tại `/booking`, vừa nhúng
 * vào `BookingCTASection` của Landing Page mà không phải duplicate logic.
 *
 * Props:
 *  - `initialValues`: prefill form (vd. từ query string `?name=...&phone=...`).
 *  - `variant`: `'standalone'` (mặc định, dành cho `/booking`) hoặc
 *    `'embedded'` (khi nhúng trong landing — bỏ nút "Quay về trang chủ" ở
 *    Step 4 và scroll trong nội bộ section thay vì cuộn cả trang).
 *  - `showHeader`: hiển thị tiêu đề mặc định (true cho standalone, false khi
 *    section cha đã có heading riêng).
 */
const BookingWizard = ({
  initialValues,
  variant = 'standalone',
  showHeader = true,
  className,
}) => {
  const { toast } = useToast();
  const rootRef = useRef(null);

  const baseForm = useMemo(
    () => ({ ...INITIAL_BOOKING_FORM, ...(initialValues || {}) }),
    // initialValues chỉ áp dụng khi mount; nếu cha thay đổi runtime, reset
    // dữ liệu sẽ làm mất input của user — không mong muốn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(baseForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  // Theo dõi step trước đó để chỉ cuộn khi user *đổi* step.
  // Một flag `didMount` không đủ vì <StrictMode> dev double-fire effect trên
  // CÙNG một instance — flag sẽ bị set ở lần fire đầu rồi tự kích hoạt cuộn
  // ở lần fire thứ hai. So sánh với step trước thì lần nào cũng bằng nhau ở
  // initial render → không cuộn.
  const prevStepRef = useRef(step);

  useEffect(() => {
    if (prevStepRef.current === step) return;
    prevStepRef.current = step;
    if (variant === 'embedded') {
      rootRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, variant]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const goNext = () => {
    let stepErrors = {};
    if (step === 1) stepErrors = validateStep1(form);
    else if (step === 2) stepErrors = validateStep2(form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast({
        title: 'Vui lòng kiểm tra lại thông tin',
        description: 'Một số trường chưa hợp lệ.',
        variant: 'destructive',
      });
      return;
    }
    setErrors({});
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    const allErrors = validateAll(form);
    const onlyStep3 = validateStep3(form);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (Object.keys(validateStep1(form)).length > 0) setStep(1);
      else if (Object.keys(validateStep2(form)).length > 0) setStep(2);
      toast({
        title: 'Không thể gửi yêu cầu',
        description:
          Object.values(onlyStep3)[0] ||
          'Vui lòng kiểm tra lại các thông tin bắt buộc.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildBookingPayload(form, {
        source: SOURCE_LANDING_PAGE,
      });
      const data = await onlineBookingApi.submit(payload);
      setResult(data);
      setStep(4);
      toast({
        title: 'Gửi yêu cầu thành công',
        description: data?.code
          ? `Mã yêu cầu: ${data.code}. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.`
          : 'Chúng tôi đã tiếp nhận yêu cầu của bạn.',
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.';
      toast({
        title: 'Gửi yêu cầu thất bại',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setForm(INITIAL_BOOKING_FORM);
    setErrors({});
    setResult(null);
    setStep(1);
  };

  return (
    <div ref={rootRef} className={cn('flex flex-col', className)}>
      {showHeader && (
        <header className="mb-2">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            Đặt lịch tư vấn / Thăm khám
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vui lòng điền thông tin để chúng tôi hỗ trợ bạn tốt nhất.
          </p>
        </header>
      )}

      <StepIndicator currentStep={step} />

      <div className="flex-1">
        {step === 1 && (
          <Step1PersonalInfo
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        )}
        {step === 2 && (
          <Step2NeedsTime
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        )}
        {step === 3 && (
          <Step3Confirmation
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        )}
        {step === 4 && (
          <Step4Success
            result={result}
            email={form.email}
            onCreateAnother={handleCreateAnother}
            hideHomeAction={variant === 'embedded'}
          />
        )}
      </div>

      {step !== 4 && (
        <div className="flex justify-between gap-3 mt-8 border-t border-gray-100 pt-6">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={goBack}
              disabled={submitting}
              className="rounded-lg px-6"
            >
              Quay lại
            </Button>
          ) : (
            <span />
          )}

          {step < 3 && (
            <Button
              onClick={goNext}
              className="rounded-lg px-6"
              disabled={submitting}
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || !form.acceptedTerms || !form.captchaVerified
              }
              className="rounded-lg px-6"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Gửi yêu cầu đặt lịch
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingWizard;
