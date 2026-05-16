import React from 'react';

import {
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  SECTION_ALT,
  SUBTITLE,
  TITLE,
} from '../styles';
import { BEFORE_AFTER_CASES } from '../data';
import { handleImgError } from '../utils';

const BeforeAfterSection = () => (
  <section className={SECTION_ALT}>
    <div className={CONTAINER}>
      <header className={HEADING_BLOCK}>
        <p className={EYEBROW}>Thực tế điều trị</p>
        <h2 className={TITLE}>Hình Ảnh Trước & Sau</h2>
        <p className={SUBTITLE}>
          Sự thay đổi kỳ diệu mang lại sự tự tin cho hàng ngàn khách hàng.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        {BEFORE_AFTER_CASES.map((c) => (
          <article
            key={c.id}
            className="relative rounded-2xl overflow-hidden group bg-slate-900 shadow-sm hover:shadow-md transition duration-300"
          >
            <img
              src={c.image}
              alt={c.title}
              className="w-full object-cover aspect-video group-hover:scale-105 transition duration-500"
              loading="lazy"
              decoding="async"
              onError={handleImgError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/0 to-transparent" />
            <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full ring-1 ring-white/10">
              Trước
            </span>
            <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              Sau
            </span>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-semibold text-base md:text-lg drop-shadow">
                {c.title}
              </h3>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default BeforeAfterSection;
