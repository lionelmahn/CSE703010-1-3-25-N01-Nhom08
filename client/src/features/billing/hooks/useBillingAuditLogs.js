import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { billingApi } from '@/api/billingApi';

const DEFAULTS = { from: '', to: '', action: '', actor_id: '' };

export default function useBillingAuditLogs() {
  const [filters, setFilters] = useState(DEFAULTS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params = useMemo(() => {
    const out = { page, per_page: perPage };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    });
    return out;
  }, [filters, page, perPage]);

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await billingApi.auditLogs(params);
      if (id !== reqId.current) return;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage });
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai audit log.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [params, perPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const setFilter = useCallback((key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { filters, setFilter, items, meta, loading, error, page, setPage, perPage, setPerPage, refresh };
}
