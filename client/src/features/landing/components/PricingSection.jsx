import React from 'react';
import { ArrowRight, Check, X as XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  BTN_INVERTED,
  BTN_OUTLINE_PRIMARY,
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  SECTION_ALT,
  SUBTITLE,
  TITLE,
} from '../styles';
import { PRICING_PLANS } from '../data';
import { scrollToBooking } from '../utils';

const PricingSection = () => {
  return (
    <section id="bang-gia" className={SECTION_ALT}>
      <div className={CONTAINER}>
        <header className={HEADING_BLOCK}>
          <p className={EYEBROW}>Bảng giá tham khảo</p>
          <h2 className={TITLE}>Chi Phí Hợp Lý, Minh Bạch</h2>
          <p className={SUBTITLE}>
            Cam kết không phát sinh chi phí trong suốt quá trình điều trị.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const isHighlight = plan.highlight;
            const ctaClass = isHighlight
              ? `${BTN_INVERTED} w-full`
              : `${BTN_OUTLINE_PRIMARY} w-full`;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition duration-300 flex flex-col ${
                  isHighlight
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 lg:-mt-4 lg:-mb-4 lg:py-12 z-10'
                    : 'bg-white border border-slate-100 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <Badge
                    variant="promo"
                    className="absolute top-0 right-6 -translate-y-1/2 uppercase tracking-wide shadow-sm px-3 py-1"
                  >
                    {plan.badge}
                  </Badge>
                )}
                <h3
                  className={`text-base md:text-lg font-semibold mb-3 ${
                    isHighlight ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {plan.title}
                </h3>

                <div className="flex items-baseline gap-2 mb-6 flex-wrap">
                  {plan.prefix && (
                    <span
                      className={`text-sm ${
                        isHighlight ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {plan.prefix}
                    </span>
                  )}
                  {plan.originalPrice && (
                    <span
                      className={`text-base line-through ${
                        isHighlight ? 'text-blue-200/70' : 'text-slate-400'
                      }`}
                    >
                      {plan.originalPrice}
                    </span>
                  )}
                  <span
                    className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
                      isHighlight ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      isHighlight ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {plan.unit}
                  </span>
                </div>

                <ul
                  className={`space-y-3 mb-8 text-sm flex-1 ${
                    isHighlight ? 'text-blue-50' : 'text-slate-600'
                  }`}
                >
                  {plan.features.map((feat) => (
                    <li key={feat.text} className="flex gap-2.5 items-start">
                      {feat.included ? (
                        <Check
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isHighlight ? 'text-amber-300' : 'text-emerald-500'
                          }`}
                        />
                      ) : (
                        <XIcon
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isHighlight ? 'text-blue-300/60' : 'text-slate-300'
                          }`}
                        />
                      )}
                      <span className={!feat.included && !isHighlight ? 'text-slate-400 line-through' : ''}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => scrollToBooking()}
                  className={ctaClass}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a
            href="#"
            className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1.5"
          >
            Xem toàn bộ bảng giá chi tiết
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
