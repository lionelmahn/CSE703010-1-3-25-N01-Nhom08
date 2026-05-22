import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentApi } from '@/api/appointmentApi';

/**
 * UC7 - Hook quan ly state cho calendar view (Day/Week/Month).
 *
 * - view: 'day' | 'week' | 'month'
 * - date: anchor (ISO string YYYY-MM-DD)
 * - branchId, doctorId, status: filter optional
 *
 * Re-fetch tu axios that moi khi doi view/date/filter.
 */
export const useAppointmentCalendar = (initialDate) => {
  const [view, setView] = useState('day');
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState('all');
  const [doctorId, setDoctorId] = useState('all');
  const [status, setStatus] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params = useMemo(() => {
    const out = { view, date };
    if (branchId && branchId !== 'all') out.branch_id = branchId;
    if (doctorId && doctorId !== 'all') out.doctor_id = doctorId;
    if (status && status !== 'all') out.status = status;
    return out;
  }, [view, date, branchId, doctorId, status]);

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const payload = await appointmentApi.calendar(params);
      if (id !== reqId.current) return;
      setData(payload);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai du lieu lich hen');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  /** Doi anchor date theo step phu thuoc view. */
  const shift = useCallback(
    (direction) => {
      const cur = new Date(date + 'T00:00:00');
      if (view === 'day') cur.setDate(cur.getDate() + direction);
      else if (view === 'week') cur.setDate(cur.getDate() + 7 * direction);
      else if (view === 'month') cur.setMonth(cur.getMonth() + direction);
      setDate(cur.toISOString().slice(0, 10));
    },
    [date, view],
  );

  const goToday = useCallback(() => setDate(new Date().toISOString().slice(0, 10)), []);

  return {
    view,
    setView,
    date,
    setDate,
    branchId,
    setBranchId,
    doctorId,
    setDoctorId,
    status,
    setStatus,
    data,
    loading,
    error,
    refresh,
    shift,
    goToday,
  };
};

export default useAppointmentCalendar;
