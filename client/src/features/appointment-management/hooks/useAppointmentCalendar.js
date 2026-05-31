import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentApi } from '@/api/appointmentApi';

/**
 * Format a Date (or date-like value) into 'YYYY-MM-DD' using *local* timezone.
 * Avoids the UTC-shift bug caused by Date.toISOString().
 */
const toLocalDateString = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Pure function: shift a 'YYYY-MM-DD' string by ±1 day / ±7 days / ±1 month
 * depending on the calendar view.  Uses Date.UTC arithmetic so it is completely
 * timezone-independent and safe to double-invoke (React StrictMode).
 */
const shiftDateString = (dateString, view, direction) => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return toLocalDateString();
  }

  if (view === 'day' || view === 'week') {
    const step = view === 'week' ? 7 : 1;
    const utc = Date.UTC(year, month - 1, day + step * direction);
    const shifted = new Date(utc);
    return [
      shifted.getUTCFullYear(),
      String(shifted.getUTCMonth() + 1).padStart(2, '0'),
      String(shifted.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  // Month view: shift by ±1 month, clamp day to last day of target month.
  const date = new Date(year, month - 1, day, 12, 0, 0);
  date.setMonth(date.getMonth() + direction);
  return toLocalDateString(date);
};

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
  const [date, setDate] = useState(initialDate || toLocalDateString());
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

  /**
   * Navigate the anchor date forward (+1) or backward (-1).
   * Uses a functional state update so the direction is always applied
   * to the latest date, even under React StrictMode double-invocation.
   */
  const shift = useCallback(
    (direction) => {
      setDate((current) => shiftDateString(current, view, direction));
    },
    [view],
  );

  const goPrevious = useCallback(() => shift(-1), [shift]);
  const goNext = useCallback(() => shift(1), [shift]);
  const goToday = useCallback(() => setDate(toLocalDateString()), []);

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
    goPrevious,
    goNext,
    goToday,
  };
};

export default useAppointmentCalendar;
