import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * A single sidebar entry. Supports two visual modes:
 *   - expanded : icon + label + optional badge on the right
 *   - collapsed: icon only with the badge overlaid on the icon
 *
 * Closes the mobile drawer on navigation via `onNavigate`.
 */
const SidebarItem = ({ item, collapsed = false, badgeCount = 0, onNavigate }) => {
  const Icon = item.icon;
  const showBadge = badgeCount > 0;
  const badgeText = badgeCount > 99 ? '99+' : badgeCount;

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={({ isActive }) =>
        [
          // `min-w-0` is required so the inner `truncate` actually clamps
          // long Vietnamese labels instead of expanding the row width.
          'group relative flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/30'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white',
        ].join(' ')
      }
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        {Icon ? <Icon size={20} aria-hidden="true" /> : null}
        {collapsed && showBadge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-slate-900 bg-red-500 px-1 text-[9px] font-bold text-white">
            {badgeText}
          </span>
        )}
      </span>

      {!collapsed && (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {showBadge && (
            <span className="flex h-[18px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {badgeText}
            </span>
          )}
        </span>
      )}
    </NavLink>
  );
};

export default SidebarItem;
