import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { notificationApi } from '@/api/notificationApi';

import { NOTIFICATION_STATUS } from '../constants';

/**
 * UC10 - Nut "Gui lai". Chi enable khi status = failed (BR-Resend). Voi sent
 * thi UI nen huong dan dung manual send.
 */
const ResendNotificationButton = ({ notification, hasPermission = true, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!hasPermission) return null;

  const canResend = notification?.status === NOTIFICATION_STATUS.FAILED;

  const handle = async () => {
    if (!notification?.id) return;
    setLoading(true);
    try {
      const res = await notificationApi.resend(notification.id);
      toast({ title: 'Da gui lai', description: `Ma thong bao moi: ${res?.data?.code || ''}` });
      onSuccess?.(res?.data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Khong the gui lai.';
      toast({ variant: 'destructive', title: 'Loi', description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handle}
      disabled={!canResend || loading}
      title={canResend ? 'Gui lai thong bao that bai' : 'Chi gui lai duoc thong bao that bai. Sent: hay dung "Gui thu cong".'}
    >
      <RotateCw className={`mr-1 size-4 ${loading ? 'animate-spin' : ''}`} /> Gui lai
    </Button>
  );
};

export default ResendNotificationButton;
