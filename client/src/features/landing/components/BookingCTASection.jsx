import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';

import { BTN_PRIMARY, CONTAINER } from '../styles';
import { BOOKING_SERVICE_OPTIONS, CLINIC_CONTACT } from '../data';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm placeholder:text-slate-400';

const BookingCTASection = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', service: '' });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    // UC6.1 backend chưa tồn tại — dẫn user sang trang /booking kèm thông tin tạm.
    const params = new URLSearchParams();
    if (form.name) params.set('name', form.name);
    if (form.phone) params.set('phone', form.phone);
    if (form.service) params.set('service', form.service);
    const query = params.toString();
    navigate(query ? `/booking?${query}` : '/booking');
  };

  return (
    <section className="relative py-20 md:py-24 bg-slate-900 text-slate-300 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className={`${CONTAINER} relative z-10`}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
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

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl relative text-slate-800 ring-1 ring-slate-100">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
              Đăng Ký Khám
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Nhận tư vấn miễn phí trong 15 phút.
            </p>
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <label
                  htmlFor="booking-name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  id="booking-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Nhập họ tên của bạn"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  required
                  pattern="[0-9+\s().-]{8,15}"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="Nhập số điện thoại"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="booking-service"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Dịch vụ quan tâm
                </label>
                <select
                  id="booking-service"
                  value={form.service}
                  onChange={handleChange('service')}
                  className={`${inputClass} landing-select-chevron appearance-none`}
                >
                  <option value="">Chọn dịch vụ</option>
                  {BOOKING_SERVICE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className={`${BTN_PRIMARY} w-full justify-center mt-2`}
              >
                Gửi thông tin đăng ký
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
                Thông tin của bạn được bảo mật tuyệt đối theo chính sách của
                chúng tôi.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingCTASection;
