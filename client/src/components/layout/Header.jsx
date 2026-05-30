import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import UserMenu from './UserMenu';

/**
 * Top app bar. Renders:
 *   - hamburger (mobile only)
 *   - breadcrumb / page title (md+)
 *   - search input (lg+, hidden for patients)
 *   - notifications bell
 *   - user menu
 */
const Header = ({
  userName,
  userRole,
  onOpenMobileSidebar,
  onLogout,
  notificationCount = 0,
}) => {
  const showSearch = userRole !== 'benh_nhan';
  const badgeText = notificationCount > 99 ? '99+' : notificationCount;

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        aria-label="Mở menu điều hướng"
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-600 md:hidden"
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumb />
      </div>

      {showSearch && (
        <div className="relative hidden flex-1 lg:block lg:max-w-sm">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Tìm kiếm..."
            aria-label="Tìm kiếm"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <button
          type="button"
          aria-label="Xem thông báo"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-600"
        >
          <Bell size={20} aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
              {badgeText}
            </span>
          )}
        </button>

        <UserMenu userName={userName} userRole={userRole} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;
