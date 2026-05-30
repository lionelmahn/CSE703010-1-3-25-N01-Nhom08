import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { billingApi } from '@/api/billingApi';

const DEFAULTS = {
  q: '',
  tab: 'pending',
  from: '',
  to: '',
};

/**
 * UC13 - Hook fetch queue thanh toan + counts cho tab.
 */
export default function useBillingQueue({ pollMs = 0 } = {}) {
  const [filters, setFilters] = useState(DEFAULTS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });
  const [counts, setCounts] = useState({ pending: 0, partial: 0, overdue: 0, paid: 0, cancelled: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cleaned = useMemo(() => {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
    });
    return out;
  }, [filters]);

  const params = useMemo(() => ({ ...cleaned, page, per_page: perPage }), [cleaned, page, perPage]);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await billingApi.queue(params);
      if (id !== reqId.current) return;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage });
      setCounts(data?.counts || {});
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai hang doi.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [params, perPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const timer = setInterval(refresh, pollMs);
    return () => clearInterval(timer);
  }, [refresh, pollMs]);

  const setFilter = useCallback((key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setPage(1);
    setFilters(DEFAULTS);
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
    items,
    meta,
    counts,
    loading,
    error,
    page,
    setPage,
    perPage,
    setPerPage,
    refresh,
  };
}
