import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BTN_INVERTED,
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  ICON_BOX_GLASS,
  ICON_BOX_SOFT,
  SECTION_ALT,
  SUBTITLE,
  TITLE,
} from '../styles';
import { FEATURED_SERVICE, SERVICES, SERVICE_CATEGORIES } from '../data';

const ServiceSection = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return SERVICES;
    return SERVICES.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="dich-vu" className={SECTION_ALT}>
      <div className={CONTAINER}>
        <header className={HEADING_BLOCK}>
          <p className={EYEBROW}>Dịch vụ của chúng tôi</p>
          <h2 className={TITLE}>Giải Pháp Răng Miệng Toàn Diện</h2>
          <p className={SUBTITLE}>
            Đa dạng dịch vụ từ tổng quát, thẩm mỹ đến phục hình — đáp ứng mọi
            nhu cầu chăm sóc nụ cười.
          </p>
        </header>

        <div className="flex justify-center gap-2 md:gap-3 mb-10 overflow-x-auto landing-no-scrollbar pb-1 -mx-4 px-4">
          {SERVICE_CATEGORIES.map((category) => {
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`h-10 px-5 rounded-full font-medium text-sm whitespace-nowrap transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="relative bg-blue-600 text-white rounded-2xl p-8 md:p-10 flex flex-col justify-between shadow-lg shadow-blue-500/20 overflow-hidden">
            <div
              className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className={ICON_BOX_GLASS}>{FEATURED_SERVICE.icon}</div>
              <h3 className="text-2xl font-bold mt-6 mb-3 leading-snug">
                {FEATURED_SERVICE.title}
              </h3>
              <p className="text-blue-50 leading-relaxed mb-8">
                {FEATURED_SERVICE.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/booking')}
              className={`${BTN_INVERTED} self-start`}
            >
              {FEATURED_SERVICE.cta}
            </button>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6 md:gap-8">
            {filteredServices.map((service) => (
              <article
                key={service.id}
                className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 cursor-pointer"
              >
                <div
                  className={`${ICON_BOX_SOFT} group-hover:bg-blue-600 group-hover:text-white`}
                >
                  {service.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mt-5 mb-2">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {service.description}
                </p>
              </article>
            ))}
            {!filteredServices.length && (
              <div className="sm:col-span-2 p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center text-sm text-slate-500 bg-white/60">
                Hiện chưa có dịch vụ trong nhóm này. Vui lòng chọn nhóm khác hoặc
                đặt lịch để được tư vấn.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;
