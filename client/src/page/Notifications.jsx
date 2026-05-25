import React, { useState } from 'react';
import { Bell } from 'lucide-react';

import Pagination from '@/features/online-booking-management/components/Pagination';
import { useAuth } from '@/hooks/useAuth';

import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import NotificationStatusTabs from '@/features/notifications/components/NotificationStatusTabs';
import NotificationFilters from '@/features/notifications/components/NotificationFilters';
import NotificationTable from '@/features/notifications/components/NotificationTable';
import NotificationDetailDrawer from '@/features/notifications/components/NotificationDetailDrawer';
import ManualSendDialog from '@/features/notifications/components/ManualSendDialog';
import { Button } from '@/components/ui/button';

/**
 * UC10 - Trang quan ly thong bao lich hen.
 *
 * Layout: header + tabs (status) + filters + table + pagination + drawer.
 */
const NotificationsPage = () => {
  const { hasPermission, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const canSendManual = isAdmin || hasPermission?.('notifications.send_manual');

  const list = useNotifications();
  const [openId, setOpenId] = useState(null);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Thong bao lich hen (UC10)</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={list.refresh}>Lam moi</Button>
          {canSendManual && (
            <ManualSendDialog hasPermission={canSendManual} onSuccess={list.refresh} />
          )}
        </div>
      </div>

      <NotificationStatusTabs
        value={list.filters.status || 'all'}
        counts={list.counts}
        onChange={(v) => list.setFilter('status', v)}
      />

      <NotificationFilters
        filters={list.filters}
        setFilter={list.setFilter}
        onReset={list.resetFilters}
      />

      <NotificationTable
        items={list.items}
        loading={list.loading}
        error={list.error}
        selectedId={openId}
        onSelect={setOpenId}
      />

      <div className="rounded border border-gray-200 bg-white">
        <Pagination
          meta={list.meta}
          page={list.page}
          onPageChange={list.setPage}
          perPage={list.perPage}
          onPerPageChange={list.setPerPage}
        />
      </div>

      <NotificationDetailDrawer
        open={openId !== null}
        notificationId={openId}
        onClose={() => setOpenId(null)}
        onChanged={list.refresh}
      />
    </div>
  );
};

export default NotificationsPage;
