import { useCallback, useEffect, useMemo, useState } from 'react';
import { hourlyRateApi } from '@/api/hourlyRateApi';

export const useHourlyRates = () => {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const params = useMemo(
    () => ({
      ...filters,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await hourlyRateApi.list(params);
      setItems(data?.data || []);
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách mức tiền/giờ.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
  }, [fetchList]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ status: 'all', from: '', to: '' });
  };

  return {
    items,
    meta,
    loading,
    error,
    filters,
    setFilter,
    resetFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    refetch: fetchList,
  };
};
