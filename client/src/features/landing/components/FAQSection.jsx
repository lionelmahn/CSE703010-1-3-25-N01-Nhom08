import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import {
  BTN_SECONDARY,
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  SECTION_LIGHT,
  SUBTITLE,
  TITLE,
} from '../styles';
import { FAQS } from '../data';

const FAQSection = () => {
  const initialOpen = FAQS.find((f) => f.open)?.id ?? null;
  const [openId, setOpenId] = useState(initialOpen);

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <section className={SECTION_LIGHT}>
      <div className={`${CONTAINER} max-w-3xl`}>
        <header className={HEADING_BLOCK}>
          <p className={EYEBROW}>Câu hỏi thường gặp</p>
          <h2 className={TITLE}>Giải Đáp Thắc Mắc</h2>
          <p className={SUBTITLE}>
            Tổng hợp các câu hỏi phổ biến của khách hàng trước khi đến nha khoa.
          </p>
        </header>

        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-2xl px-5 py-4 transition duration-200 ${
                  isOpen
                    ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-blue-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full flex justify-between items-center text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <h3
                    className={`font-semibold text-base md:text-lg ${
                      isOpen ? 'text-blue-700' : 'text-slate-900'
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition ${
                      isOpen
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed mt-3 pr-12">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <button type="button" className={BTN_SECONDARY}>
            Xem thêm câu hỏi
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
