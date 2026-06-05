import { useCallback, useEffect, useMemo, useState } from 'react';
import { shiftCoefficientApi } from '@/api/shiftCoefficientApi';

export const useShiftCoefficients = () => {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    day_type: 'all',
    shift_type: 'all',
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
      const { data } = await shiftCoefficientApi.list(params);
      setItems(data?.data || []);
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách hệ số ca.');
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
    setFilters({ status: 'all', day_type: 'all', shift_type: 'all', from: '', to: '' });
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
