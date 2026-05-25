import React, { useState } from 'react';
import { X, Ban } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/api/notificationApi';

import { useNotificationDetail } from '../hooks/useNotificationDetail';
import NotificationStatusBadge from './NotificationStatusBadge';
import NotificationTypeBadge from './NotificationTypeBadge';
import NotificationContentPreview from './NotificationContentPreview';
import NotificationTimelineList from './NotificationTimelineList';
import ResendNotificationButton from './ResendNotificationButton';
import { CHANNEL_LABEL, NOTIFICATION_STATUS, SOURCE_LABEL } from '../constants';

const formatDateTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return iso;
  }
};

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 py-1">
    <div className="text-xs uppercase text-gray-500">{label}</div>
    <div className="col-span-2 text-sm text-gray-800">{value || '-'}</div>
  </div>
);

const NotificationDetailDrawer = ({ open, notificationId, onClose, onChanged }) => {
  const { toast } = useToast();
  const { hasPermission, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const canResend = isAdmin || hasPermission?.('notifications.resend');
  const canCancel = isAdmin || hasPermission?.('notifications.cancel');

  const { notification, loading, error, refresh } = useNotificationDetail(open ? notificationId : null);
  const [cancelling, setCancelling] = useState(false);

  if (!open) return null;

  const handleCancel = async () => {
    if (!notification?.id) return;
    if (notification.status !== NOTIFICATION_STATUS.PENDING) {
      toast({ variant: 'destructive', title: 'Khong the huy', description: 'Chi huy duoc thong bao Cho gui.' });
      return;
    }
    setCancelling(true);
    try {
      await notificationApi.cancel(notification.id);
      toast({ title: 'Da huy thong bao' });
      await refresh();
      onChanged?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Loi',
        description: err?.response?.data?.message || err?.message || 'Khong the huy.',
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <div className="text-sm text-gray-500">Chi tiet thong bao</div>
            <div className="font-mono text-base font-semibold text-gray-900">
              {notification?.code || (loading ? '...' : '-')}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </header>

        {loading && (
          <div className="p-6 text-center text-gray-500">Dang tai...</div>
        )}
        {error && (
          <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {notification && (
          <div className="space-y-5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <NotificationStatusBadge status={notification.status} size="md" />
              <NotificationTypeBadge type={notification.type} />
              <span className="ml-auto flex flex-wrap items-center gap-2">
                <ResendNotificationButton
                  notification={notification}
                  hasPermission={canResend}
                  onSuccess={() => { refresh(); onChanged?.(); }}
                />
                {canCancel && notification.status === NOTIFICATION_STATUS.PENDING && (
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={cancelling}>
                    <Ban className="mr-1 size-4" /> Huy
                  </Button>
                )}
              </span>
            </div>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Thong tin co ban</h3>
              <div className="rounded border border-gray-200 bg-white p-3">
                <InfoRow label="Ma" value={<span className="font-mono">{notification.code}</span>} />
                <InfoRow label="Kenh" value={CHANNEL_LABEL[notification.channel] || notification.channel} />
                <InfoRow label="Nguon" value={SOURCE_LABEL[notification.source] || notification.source} />
                <InfoRow
                  label="Nguoi nhan"
                  value={<>
                    <div>{notification.recipient_name}</div>
                    <div className="text-xs text-gray-500">{notification.recipient_email}</div>
                  </>}
                />
                <InfoRow label="Template" value={notification.template_code} />
                <InfoRow label="Tao luc" value={formatDateTime(notification.created_at)} />
                <InfoRow label="Lap lich" value={formatDateTime(notification.scheduled_send_at)} />
                <InfoRow label="Gui luc" value={formatDateTime(notification.sent_at)} />
                <InfoRow label="So lan retry" value={notification.retry_count} />
                <InfoRow label="So lan gui lai thu cong" value={notification.manual_resend_count} />
                {notification.error_code && (
                  <InfoRow
                    label="Loi"
                    value={<span className="text-red-600">{notification.error_code}: {notification.error_message}</span>}
                  />
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Lien ket</h3>
              <div className="rounded border border-gray-200 bg-white p-3">
                <InfoRow label="Appointment" value={notification.appointment?.code || notification.appointment_id || '-'} />
                <InfoRow label="Online Booking" value={notification.online_booking_request?.code || notification.online_booking_request_id || '-'} />
                <InfoRow label="Patient" value={notification.patient?.full_name || notification.patient_id || '-'} />
                {notification.parent_notification_id && (
                  <InfoRow
                    label="Goc (resend)"
                    value={<span className="font-mono text-xs">#{notification.parent_notification_id}</span>}
                  />
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Noi dung</h3>
              <NotificationContentPreview
                subject={notification.subject}
                html={notification.body_html}
                text={notification.body_text}
              />
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Lich su su kien</h3>
              <NotificationTimelineList events={notification.events || []} />
            </section>
          </div>
        )}
      </aside>
    </>
  );
};

export default NotificationDetailDrawer;
