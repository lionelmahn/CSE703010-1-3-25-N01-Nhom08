import React from 'react';

import { CONTAINER } from '../styles';
import { FOOTER_LINKS } from '../data';

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
    <div className={`${CONTAINER} py-12`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30">
            D
          </div>
          <div>
            <div className="font-bold text-base text-white">DentalClinic</div>
            <div className="text-xs text-slate-500">
              Nụ cười rạng rỡ — sức khoẻ tuyệt vời
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3 text-sm">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-400 hover:text-white transition"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>
          &copy; {new Date().getFullYear()} Dental Clinic. All rights reserved.
        </p>
        <p>Hệ thống quản lý phòng khám nha khoa.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
