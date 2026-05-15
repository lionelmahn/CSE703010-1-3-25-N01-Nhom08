import React from 'react';

import {
  CONTAINER,
  EYEBROW,
  HEADING_BLOCK,
  ICON_BOX_SOFT,
  SECTION_LIGHT,
  SUBTITLE,
  TITLE,
} from '../styles';
import { PROCESS_HIGHLIGHTS } from '../data';

const ProcessSection = () => (
  <section className={SECTION_LIGHT}>
    <div className={CONTAINER}>
      <header className={HEADING_BLOCK}>
        <p className={EYEBROW}>Lý do chọn chúng tôi</p>
        <h2 className={TITLE}>Điểm Khác Biệt Tại Dental Clinic</h2>
        <p className={SUBTITLE}>
          Quy trình chuẩn quốc tế kết hợp chuyên môn cao và trang thiết bị hiện
          đại — mang lại trải nghiệm điều trị tối ưu.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PROCESS_HIGHLIGHTS.map((item) => (
          <div key={item.title} className="text-center px-2">
            <div className={`${ICON_BOX_SOFT} w-16 h-16 mx-auto text-3xl rounded-2xl mb-5`}>
              {item.icon}
            </div>
            <h3 className="font-semibold text-slate-900 mb-2 text-lg">
              {item.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProcessSection;
