import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentApi } from '@/api/appointmentApi';
import { doctorApi } from '@/api/doctorApi';

/**
 * UC8 - State cho trang dispatch (`/doctor-dispatch`):
 *  - Queue lich hen `cho_phan_cong_bac_si` (paginate).
 *  - Workload tom tat tat ca bac si trong ngay.
 *  - Filter: branch_id, date, q.
 */
export const useDoctorDispatch = (initialDate) => {
  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState({
    branch_id: 'all',
    date: initialDate || today,
    q: '',
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pending, setPending] = useState([]);
  const [pendingMeta, setPendingMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 });
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const cleanedFilters = useMemo(() => {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') out[k] = v;
    });
    return out;
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const [pendingRes, workloadRes] = await Promise.all([
        appointmentApi.pendingForAssignment({ ...cleanedFilters, page, per_page: perPage }),
        doctorApi.workload({
          date: filters.date,
          ...(filters.branch_id && filters.branch_id !== 'all' ? { branch_id: filters.branch_id } : {}),
        }),
      ]);
      if (id !== reqId.current) return;
      setPending(Array.isArray(pendingRes?.data) ? pendingRes.data : []);
      setPendingMeta(pendingRes?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage });
      setWorkload(Array.isArray(workloadRes) ? workloadRes : []);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai du lieu dispatch');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [cleanedFilters, page, perPage, filters.date, filters.branch_id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const setFilter = useCallback((key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    filters,
    setFilter,
    page,
    setPage,
    perPage,
    setPerPage,
    pending,
    pendingMeta,
    workload,
    loading,
    error,
    refresh,
  };
};

export default useDoctorDispatch;
