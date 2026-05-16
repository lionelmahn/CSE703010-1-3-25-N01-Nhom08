import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { BTN_GHOST, BTN_PRIMARY } from '../styles';
import { NAV_LINKS } from '../data';
import { scrollToBooking } from '../utils';

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goBooking = () => {
    setOpen(false);
    // Nếu đang ở landing và section đặt lịch tồn tại → cuộn xuống.
    // Ngược lại (route khác, ví dụ /login) thì fallback navigate.
    if (!scrollToBooking()) {
      navigate('/#dat-lich');
    }
  };

  const goLogin = () => {
    setOpen(false);
    navigate('/login');
  };

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur shadow-sm border-b border-slate-100'
          : 'bg-white/80 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30 group-hover:shadow-md transition">
              D
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Dental<span className="text-blue-600">Clinic</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {NAV_LINKS.map((link, idx) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`px-3 py-2 rounded-full transition ${
                  idx === 0
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button type="button" onClick={goLogin} className={BTN_GHOST}>
              Đăng nhập
            </button>
            <button type="button" onClick={goBooking} className={BTN_PRIMARY}>
              Đặt lịch khám
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            aria-label="Mở menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 py-3 flex flex-col gap-1 text-sm font-medium text-slate-700">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={goLogin}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-semibold px-7 py-3 transition"
              >
                Đăng nhập
              </button>
              <button type="button" onClick={goBooking} className={BTN_PRIMARY}>
                Đặt lịch khám
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
