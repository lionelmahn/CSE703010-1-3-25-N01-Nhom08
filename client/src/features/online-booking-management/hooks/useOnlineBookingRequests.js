import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onlineBookingRequestApi } from '@/api/onlineBookingRequestApi';
import { DEFAULT_FILTERS, DEFAULT_PER_PAGE } from '../constants';

/**
 * Hook list yeu cau dat lich online cho receptionist (UC6.2).
 * - Filter theo trang thai, chi nhanh, dich vu, ngay gui, search.
 * - Pagination + meta.
 * - counts cho sidebar badge.
 */
export const useOnlineBookingRequests = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: DEFAULT_PER_PAGE });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params = useMemo(
    () => ({ ...filters, page, per_page: perPage }),
    [filters, page, perPage],
  );

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const data = await onlineBookingRequestApi.list(params);
      if (id !== reqId.current) return;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setMeta({
        total: data?.total || 0,
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        per_page: data?.per_page || perPage,
      });
      setCounts(data?.counts || {});
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai danh sach yeu cau');
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
