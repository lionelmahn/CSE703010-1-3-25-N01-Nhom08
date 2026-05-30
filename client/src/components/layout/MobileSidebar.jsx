import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import SidebarGroup from './SidebarGroup';

/**
 * Drawer-style sidebar used below md. Slides in from the left, dims the
 * rest of the screen, closes on backdrop click / Escape / nav click.
 */
const MobileSidebar = ({
  open,
  onClose,
  groupedItems,
  badgeValues = {},
  onLogout,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={[
        'fixed inset-0 z-50 md:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      ].join(' ')}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={[
          'absolute inset-0 bg-slate-900/60 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        className={[
          'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-xl transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-lg font-bold">
              D
            </div>
            <span className="text-base font-bold tracking-tight">DENTAL PRO</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-1">
            {groupedItems.map((group) => (
              <SidebarGroup
                key={group.id}
                group={group}
                collapsed={false}
                badgeValues={badgeValues}
                onNavigate={onClose}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onLogout?.();
            }}
            aria-label="Đăng xuất"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={20} className="shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default MobileSidebar;
