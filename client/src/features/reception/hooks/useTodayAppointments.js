import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { receptionApi } from '@/api/receptionApi';
import { RECEPTION_TODAY_REFRESH_MS } from '../constants';

const DEFAULT_FILTERS = {
  date: '',
  branch_id: 'all',
  q: '',
  arrival_filter: 'all',
};

/**
 * UC11 - Fetch + poll danh sach lich hen hom nay cho man tiep nhan (UI1-UI7).
 *
 * Tu refresh moi `RECEPTION_TODAY_REFRESH_MS` (30s) - du do tre nhung
 * khong dap database. Co the goi `refresh()` ngay sau khi mutate.
 */
export const useTodayAppointments = ({ pollMs = RECEPTION_TODAY_REFRESH_MS } = {}) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cleanedFilters = useMemo(() => {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') out[k] = v;
    });
    return out;
  }, [filters]);

  const params = useMemo(
    () => ({ ...cleanedFilters, page, per_page: perPage }),
    [cleanedFilters, page, perPage],
  );

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const data = await receptionApi.listTodayAppointments(params);
      if (id !== reqId.current) return;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage });
      setCounts(data?.counts || {});
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai danh sach.');
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

  return {
    filters,
    setFilter,
    setFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    items,
    meta,
    counts,
    loading,
    error,
    refresh,
  };
};

export default useTodayAppointments;
