import { useCallback, useEffect, useRef, useState } from 'react';
import { billingApi } from '@/api/billingApi';

export default function useBillingDashboard({ pollMs = 0 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await billingApi.dashboard();
      if (id !== reqId.current) return;
      setData(res?.data || null);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai dashboard.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { data, loading, error, refresh };
}
