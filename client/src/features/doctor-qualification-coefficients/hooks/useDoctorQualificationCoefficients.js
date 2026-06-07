/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { doctorQualificationCoefficientApi } from '@/api/doctorQualificationCoefficientApi';
import { extractApiError } from '../utils';

export const useDoctorQualificationCoefficients = () => {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [options, setOptions] = useState({ qualifications: [], types: [], statuses: [] });
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    type: 'all',
    status: 'all',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const params = useMemo(() => ({
    ...filters,
    page,
    per_page: perPage,
  }), [filters, page, perPage]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await doctorQualificationCoefficientApi.list(params);
      setItems(data?.data || []);
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
      });
    } catch (err) {
      setItems([]);
      setError(extractApiError(err, 'Không tải được danh sách hệ số học hàm/học vị.'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const { data } = await doctorQualificationCoefficientApi.options();
      setOptions(data || { qualifications: [], types: [], statuses: [] });
    } catch {
      setOptions({ qualifications: [], types: [], statuses: [] });
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ q: '', type: 'all', status: 'all', from: '', to: '' });
  };

  return {
    items,
    meta,
    options,
    loading,
    optionsLoading,
    error,
    filters,
    setFilter,
    resetFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    refetch: fetchList,
    refetchOptions: fetchOptions,
  };
};
