import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { patientsApi } from '@/api/patientsApi';

import { DEFAULT_FILTERS, DEFAULT_PER_PAGE } from '../constants';

/**
 * UC5 - hook quan ly danh sach ho so benh nhan.
 *
 * Quan ly: filters, pagination, items, meta, loading/error, refresh().
 */
export const usePatients = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: DEFAULT_PER_PAGE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params = useMemo(
    () => ({
      ...filters,
      status: filters.status === 'all' ? undefined : filters.status,
      source: filters.source === 'all' ? undefined : filters.source,
      gender: filters.gender === 'all' ? undefined : filters.gender,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      q: filters.q || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const result = await patientsApi.list(params);
      if (id !== reqId.current) return;
      setItems(result.data);
      setMeta(result.meta);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách hồ sơ.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [params]);

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
    loading,
    error,
    refresh,
  };
};
