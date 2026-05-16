import React from 'react';
import { Check } from 'lucide-react';

import { BTN_PRIMARY, CONTAINER, SECTION_ALT } from '../styles';
import { ABOUT_HIGHLIGHTS } from '../data';
import { handleImgError } from '../utils';

const AboutSection = () => (
  <section id="ve-chung-toi" className={`${SECTION_ALT} overflow-hidden`}>
    <div className={CONTAINER}>
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/60 relative z-10">
            <img
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800&auto=format&fit=crop"
              alt="Cơ sở vật chất"
              className="w-full h-auto object-cover aspect-[4/3]"
              loading="lazy"
              decoding="async"
              onError={handleImgError}
            />
          </div>
          <div className="absolute -right-4 -bottom-6 md:-right-6 bg-blue-600 text-white p-5 md:p-6 rounded-2xl shadow-xl shadow-blue-500/20 z-20">
            <div className="text-3xl md:text-4xl font-extrabold leading-none">
              10+
            </div>
            <div className="text-xs md:text-sm text-blue-100 font-medium mt-2 leading-snug">
              Năm kiến tạo
              <br />
              hàng triệu nụ cười
            </div>
          </div>
          <div className="absolute top-8 -left-8 w-full h-full rounded-3xl bg-blue-100/50 -z-0 hidden lg:block" />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
            Về chúng tôi
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight mb-5">
            Phòng Khám Nha Khoa Chuẩn Quốc Tế
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Thành lập từ năm 2014, Dental Clinic tự hào là địa chỉ chăm sóc răng
            miệng uy tín hàng đầu. Chúng tôi kết hợp giữa tay nghề bác sĩ tài
            hoa và hệ thống máy móc nhập khẩu từ Châu Âu để mang đến kết quả
            điều trị tốt nhất.
          </p>
          <ul className="space-y-3 mb-8">
            {ABOUT_HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={BTN_PRIMARY}>
            Tìm hiểu thêm
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
