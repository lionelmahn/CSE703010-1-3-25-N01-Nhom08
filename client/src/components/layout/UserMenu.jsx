import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  bac_si: 'Bác sĩ chuyên khoa',
  le_tan: 'Bộ phận lễ tân',
  ke_toan: 'Kế toán',
  benh_nhan: 'Bệnh nhân',
};

const initialsOf = (name) => {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase();
};

const UserMenu = ({ userName, userRole, onLogout }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mở menu người dùng"
        className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:bg-slate-100"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight text-slate-900">
            {userName || 'Người dùng'}
          </p>
          <p className="text-xs font-medium leading-tight text-teal-600">
            {ROLE_LABELS[userRole] || 'Người dùng'}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-teal-500 bg-slate-100 font-semibold text-teal-700">
          {initialsOf(userName)}
        </div>
        <ChevronDown size={16} className="hidden text-slate-400 sm:block" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{userName || 'Người dùng'}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[userRole] || 'Người dùng'}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <User size={16} aria-hidden="true" />
            <span>Hồ sơ</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
