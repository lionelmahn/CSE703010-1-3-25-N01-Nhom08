import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BTN_OUTLINE,
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  SECTION_LIGHT,
  SUBTITLE,
  TITLE,
} from '../styles';
import { DOCTORS } from '../data';

const DoctorSection = () => {
  const navigate = useNavigate();

  return (
    <section id="bac-si" className={SECTION_LIGHT}>
      <div className={CONTAINER}>
        <header className={HEADING_BLOCK}>
          <p className={EYEBROW}>Đội ngũ chuyên môn</p>
          <h2 className={TITLE}>Bác Sĩ Chuyên Khoa Giỏi</h2>
          <p className={SUBTITLE}>
            Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và liên tục cập nhật kỹ
            thuật điều trị tiên tiến.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {DOCTORS.map((doctor) => (
            <article
              key={doctor.id}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-1">
                  {doctor.name}
                </h3>
                <p className="text-blue-600 text-sm font-medium mb-5">
                  {doctor.role}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className={`${BTN_OUTLINE} w-full`}
                >
                  Đặt lịch với bác sĩ
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoctorSection;
