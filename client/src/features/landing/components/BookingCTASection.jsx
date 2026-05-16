import React from 'react';
import { MapPin, Phone } from 'lucide-react';

import { CONTAINER } from '../styles';
import { CLINIC_CONTACT } from '../data';
import BookingWizard from '@/features/online-booking/components/BookingWizard';

/**
 * Section "Đặt lịch hẹn" cuối Landing Page.
 *
 * Trước đây section này chỉ là form lead 3 trường (tên / SĐT / dịch vụ) rồi
 * điều hướng sang `/booking`. Nay nhúng trực tiếp `BookingWizard` (UC6.1) để
 * người dùng hoàn tất gửi yêu cầu ngay trên Landing Page mà không phải
 * chuyển trang.
 */
const BookingCTASection = () => {
  return (
    <section
      id="dat-lich"
      className="relative py-20 md:py-24 bg-slate-900 text-slate-300 overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className={`${CONTAINER} relative z-10`}>
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-blue-400 mb-3">
              Liên hệ đặt lịch
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-5">
              Đặt Lịch Hẹn Khám Ngay Hôm Nay!
            </h2>
            <p className="text-slate-400 mb-10 leading-relaxed max-w-md">
              Để lại thông tin, đội ngũ tư vấn viên của chúng tôi sẽ liên hệ
              lại trong vòng 15 phút để sắp xếp lịch hẹn phù hợp nhất cho bạn.
            </p>

            <div className="space-y-5 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">
                    Địa chỉ
                  </div>
                  <div className="text-white font-medium leading-relaxed">
                    {CLINIC_CONTACT.address}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">
                    Hotline (24/7)
                  </div>
                  <a
                    href={`tel:${CLINIC_CONTACT.hotline.replace(/\s/g, '')}`}
                    className="text-white font-semibold text-lg hover:text-blue-300 transition"
                  >
                    {CLINIC_CONTACT.hotline}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {CLINIC_CONTACT.socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className={`w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-white hover:border-transparent transition ${social.accent}`}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 shadow-2xl text-slate-800 ring-1 ring-slate-100">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
              Đăng Ký Khám Online
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Hoàn tất 3 bước để gửi yêu cầu — tư vấn viên sẽ liên hệ xác nhận
              trong vòng 15 phút.
            </p>
            <BookingWizard variant="embedded" showHeader={false} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingCTASection;
