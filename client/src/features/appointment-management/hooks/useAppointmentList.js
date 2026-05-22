import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentApi } from '@/api/appointmentApi';
import { DEFAULT_FILTERS, DEFAULT_PER_PAGE } from '../constants';

/**
 * UC7 - Hook quan ly state cho danh sach lich hen.
 *
 * Filter + pagination + counts. Goi axios that, khong dung mock.
 */
export const useAppointmentList = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: DEFAULT_PER_PAGE });
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
      const data = await appointmentApi.list(params);
      if (id !== reqId.current) return;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage });
      setCounts(data?.counts || {});
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai danh sach lich hen');
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

  const resetFilters = useCallback(() => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
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

export default useAppointmentList;
