import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationApi } from '@/api/notificationApi';

/**
 * UC10 - Hook lay chi tiet notification kem events/parent/children.
 */
export const useNotificationDetail = (id) => {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!id) {
      setNotification(null);
      return;
    }
    setLoading(true);
    setError(null);
    const callId = ++reqId.current;
    try {
      const data = await notificationApi.get(id);
      if (callId !== reqId.current) return;
      setNotification(data);
    } catch (err) {
      if (callId !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai chi tiet thong bao');
    } finally {
      if (callId === reqId.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { notification, loading, error, refresh };
};

export default useNotificationDetail;
