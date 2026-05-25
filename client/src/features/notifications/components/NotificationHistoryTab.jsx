import React, { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

import { useNotifications } from '../hooks/useNotifications';
import NotificationStatusBadge from './NotificationStatusBadge';
import NotificationTypeBadge from './NotificationTypeBadge';
import NotificationDetailDrawer from './NotificationDetailDrawer';
import { CHANNEL_LABEL } from '../constants';

const formatDateTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return iso;
  }
};

/**
 * UC10 - Component embed trong UC6.2 detail va UC7 detail.
 * Loc theo appointment_id hoac online_booking_request_id.
 */
const NotificationHistoryTab = ({ appointmentId = null, onlineBookingRequestId = null }) => {
  const { hasPermission, userRole } = useAuth();
  const canView = userRole === 'admin' || hasPermission?.('notifications.view');

  const initialFilters = {};
  if (appointmentId) initialFilters.appointment_id = appointmentId;
  if (onlineBookingRequestId) initialFilters.online_booking_request_id = onlineBookingRequestId;

  const { items, loading, error, refresh } = useNotifications(initialFilters);
  const [openId, setOpenId] = useState(null);

  if (!canView) {
    return <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">Ban khong co quyen xem lich su thong bao.</div>;
  }

  if (loading) {
    return <div className="rounded border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Dang tai...</div>;
  }
  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  }
  if (!items.length) {
    return <div className="rounded border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Chua co thong bao cho ban ghi nay.</div>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Ma</th>
              <th className="px-3 py-2">Loai</th>
              <th className="px-3 py-2">Trang thai</th>
              <th className="px-3 py-2">Kenh</th>
              <th className="px-3 py-2">Lap lich</th>
              <th className="px-3 py-2">Gui luc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {items.map((n) => (
              <tr
                key={n.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setOpenId(n.id)}
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{n.code}</td>
                <td className="px-3 py-2"><NotificationTypeBadge type={n.type} /></td>
                <td className="px-3 py-2"><NotificationStatusBadge status={n.status} /></td>
                <td className="px-3 py-2 text-gray-700">{CHANNEL_LABEL[n.channel] || n.channel}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{formatDateTime(n.scheduled_send_at)}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{formatDateTime(n.sent_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NotificationDetailDrawer
        open={openId !== null}
        notificationId={openId}
        onClose={() => setOpenId(null)}
        onChanged={refresh}
      />
    </>
  );
};

export default NotificationHistoryTab;
