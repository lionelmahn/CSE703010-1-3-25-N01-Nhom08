import React from 'react';
import { Star } from 'lucide-react';

import {
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  SECTION_LIGHT,
  TITLE,
} from '../styles';
import { TESTIMONIALS } from '../data';
import { handleImgError } from '../utils';

const TestimonialSection = () => (
  <section className={SECTION_LIGHT}>
    <div className={CONTAINER}>
      <header className={HEADING_BLOCK}>
        <p className={EYEBROW}>Đánh giá khách hàng</p>
        <h2 className={TITLE}>Khách Hàng Nói Gì Về Chúng Tôi</h2>
        <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">4.9</span>
            <div className="flex text-amber-400" aria-label="4.9 sao">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
          </div>
          <span className="text-sm text-slate-500">
            · Dựa trên 2,150+ đánh giá thực tế
          </span>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.id}
            className="relative bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-2xl"
          >
            <div
              className="absolute top-4 right-5 text-5xl text-blue-200 font-serif select-none leading-none pointer-events-none"
              aria-hidden="true"
            >
              &ldquo;
            </div>
            <div className="flex text-amber-400 mb-4" aria-label={`${t.rating} sao`}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <img
                src={t.avatar}
                alt={t.author}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                loading="lazy"
                decoding="async"
                onError={handleImgError}
              />
              <div>
                <div className="font-semibold text-slate-900 text-sm">
                  {t.author}
                </div>
                <div className="text-xs text-slate-500">{t.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialSection;
