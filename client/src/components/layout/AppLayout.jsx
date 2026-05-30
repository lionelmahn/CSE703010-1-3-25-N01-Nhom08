import React, { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePendingRequestCount } from '@/features/online-booking-management/hooks/usePendingRequestCount';
import {
  getVisibleSidebarItems,
  groupSidebarItems,
} from '@/config/sidebarItems';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import Header from './Header';

/**
 * Authenticated app shell.
 *
 * Layout:
 *   ┌────────────┬────────────────────────────┐
 *   │  Sidebar   │  Header                    │
 *   │ (md+, can  ├────────────────────────────┤
 *   │  collapse) │  <main>                    │
 *   │            │    <Outlet />              │
 *   │            │  </main>                   │
 *   └────────────┴────────────────────────────┘
 *
 *  - On <md the sidebar disappears and is replaced by `MobileSidebar`,
 *    triggered by the hamburger button in `Header`.
 *  - On >=lg the sidebar can collapse to an icon-only rail.
 *  - The inner `<div className="max-w-7xl mx-auto">` matches the
 *    constraint that pages such as ServicePriceManagement and the
 *    appointment calendars were built against, so they keep filling
 *    the available area correctly.
 */
const AppLayout = () => {
  const { userRole, userName, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingOnlineBookings = usePendingRequestCount();
  const badgeValues = useMemo(
    () => ({ pending_online_bookings: pendingOnlineBookings }),
    [pendingOnlineBookings],
  );

  const groupedItems = useMemo(() => {
    const visible = getVisibleSidebarItems({ userRole, hasPermission });
    return groupSidebarItems(visible);
  }, [userRole, hasPermission]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        groupedItems={groupedItems}
        collapsed={desktopCollapsed}
        onToggleCollapse={() => setDesktopCollapsed((value) => !value)}
        onLogout={handleLogout}
        badgeValues={badgeValues}
      />

      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        groupedItems={groupedItems}
        badgeValues={badgeValues}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userName={userName}
          userRole={userRole}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onLogout={handleLogout}
          notificationCount={pendingOnlineBookings}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
          {/*
            `max-w-screen-2xl` (1536px) keeps long-form forms centered on
            ultra-wide displays without throwing away horizontal space on
            data-heavy pages such as the patient list, appointments
            calendar, and revenue dashboards. `min-w-0` ensures any flex
            or grid child can shrink below its natural content width so
            tables can scroll inside their own container instead of
            pushing the page horizontally.
          */}
          <div className="mx-auto w-full min-w-0 max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
