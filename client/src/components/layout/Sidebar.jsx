import React from 'react';
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import SidebarGroup from './SidebarGroup';

/**
 * Desktop sidebar (>= md). Hidden on mobile — `MobileSidebar` renders an
 * equivalent drawer overlay there.
 *
 * Props:
 *   - groupedItems : output of `groupSidebarItems(getVisibleSidebarItems(...))`
 *   - collapsed    : icon-only mode
 *   - onToggleCollapse
 *   - onLogout
 *   - badgeValues  : { [badgeKey]: number }
 */
const Sidebar = ({
  groupedItems,
  collapsed = false,
  onToggleCollapse,
  onLogout,
  badgeValues = {},
}) => {
  return (
    <aside
      className={[
        'hidden md:flex h-screen sticky top-0 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white transition-[width] duration-300',
        collapsed ? 'w-20' : 'w-64',
      ].join(' ')}
      aria-label="Sidebar điều hướng chính"
    >
      <div
        className={[
          'flex h-16 items-center border-b border-slate-800 px-4',
          collapsed ? 'justify-center' : 'justify-between',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-lg font-bold">
            D
          </div>
          {!collapsed && (
            <span className="truncate text-base font-bold tracking-tight">DENTAL PRO</span>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Thu gọn sidebar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ChevronsLeft size={18} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Mở rộng sidebar"
          className="mx-auto mt-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ChevronsRight size={18} />
        </button>
      )}

      <nav className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-1">
          {groupedItems.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              collapsed={collapsed}
              badgeValues={badgeValues}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={onLogout}
          aria-label="Đăng xuất"
          title={collapsed ? 'Đăng xuất' : undefined}
          className={[
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
