import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationTemplateApi } from '@/api/notificationTemplateApi';

/**
 * UC10 - Hook list mau email he thong (admin).
 */
export const useNotificationTemplates = (initialFilters = {}) => {
  const [filters, setFilters] = useState({ q: '', is_active: 'all', ...initialFilters });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const callId = ++reqId.current;
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.is_active === 'active') params.is_active = 1;
      if (filters.is_active === 'inactive') params.is_active = 0;
      const data = await notificationTemplateApi.list(params);
      if (callId !== reqId.current) return;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setMeta({
        total: data?.total ?? 0,
        current_page: data?.current_page ?? 1,
        last_page: data?.last_page ?? 1,
        per_page: data?.per_page ?? 20,
      });
    } catch (err) {
      if (callId !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai danh sach mau email');
    } finally {
      if (callId === reqId.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { items, meta, filters, setFilters, loading, error, refresh };
};

export default useNotificationTemplates;
