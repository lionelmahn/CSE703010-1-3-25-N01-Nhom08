import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

import BookingWizard from '@/features/online-booking/components/BookingWizard';
import { INITIAL_BOOKING_FORM } from '@/features/online-booking/data';

/**
 * UC6.1 - Trang đặt lịch online standalone tại `/booking`.
 *
 * Trang này chủ yếu phục vụ deep-link / chia sẻ URL. Trên Landing Page, wizard
 * đã được nhúng trực tiếp vào `BookingCTASection` để người dùng đặt lịch ngay
 * mà không phải điều hướng.
 *
 * Prefill query string (?name=...&phone=...&email=...&utm_*) vẫn giữ nguyên
 * để các điểm chạm khác (banner, ads, deep-link) tiếp tục hoạt động.
 */
const BookingPage = () => {
  const [params] = useSearchParams();

  const initialValues = useMemo(() => {
    const next = { ...INITIAL_BOOKING_FORM };
    const name = params.get('name');
    const phone = params.get('phone');
    const email = params.get('email');
    if (name) next.name = name;
    if (phone) next.phone = phone;
    if (email) {
      next.email = email;
    }
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    if (utmSource || utmMedium || utmCampaign) {
      next.tracking = {
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
      };
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4" /> Về trang chủ
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <BookingWizard
            initialValues={initialValues}
            variant="standalone"
            showHeader
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
